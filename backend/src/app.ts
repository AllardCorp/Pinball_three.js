import cors from "cors";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { getAuth, type AuthInstance } from "./auth.js";
import { getDb, type DatabaseClient } from "./db/client.js";
import {
  games,
  scoreClaimRequests,
  type ScoreClaimStatus,
  users,
} from "./db/schema.js";
import { env as defaultEnv } from "./env.js";
import {
  LEADERBOARD_LIMIT,
  SCORE_CLAIM_TTL_MS,
  createScoreClaimCode,
  evaluateScorePersistence,
  getScoreClaimVerificationUrl,
} from "./services/score-claim-service.js";

const claimCodePattern = /^[A-Za-z0-9_-]{32}$/;
const integerPattern = /^-?\d+$/;
const postgresIntegerMax = 2_147_483_647;

const scoreClaimStatus = {
  pending: "pending",
  approved: "approved",
  expired: "expired",
} as const satisfies Record<ScoreClaimStatus, ScoreClaimStatus>;

type HttpError = Error & {
  status?: number;
  code?: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitRule = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  errorCode: string;
  message: string;
  resolveKey: (request: Request) => string;
};

type AppSession = {
  session: unknown;
  user: {
    email?: string | null;
    id: string;
    username?: string | null;
  };
};

type BackendAppDependencies = {
  auth: AuthInstance;
  authRouteHandler: RequestHandler;
  db: DatabaseClient;
  env: typeof defaultEnv;
  getSession: (headers: IncomingHttpHeaders) => Promise<AppSession | null>;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

export function resetRateLimitStoreForTests() {
  rateLimitStore.clear();
}

function createHttpError(
  status: number,
  code: string,
  message: string,
): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  error.code = code;
  return error;
}

function isHttpError(error: unknown): error is HttpError {
  return error instanceof Error;
}

function isInvalidJsonError(
  error: unknown,
): error is SyntaxError & { status: number } {
  return (
    error instanceof SyntaxError &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

function getClientIp(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function cleanupRateLimitStore(now: number) {
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function createRateLimitMiddleware(rule: RateLimitRule): RequestHandler {
  return (request, _response, next) => {
    const now = Date.now();
    const bucketKey = `${rule.keyPrefix}:${rule.resolveKey(request)}`;
    const currentBucket = rateLimitStore.get(bucketKey);

    // Le rate limit reste en mémoire pour l'instant.
    // Ce n'est pas encore distribué, mais cela suffit pour le flux local actuel.
    if (rateLimitStore.size > 2_000) {
      cleanupRateLimitStore(now);
    }

    if (!currentBucket || currentBucket.resetAt <= now) {
      rateLimitStore.set(bucketKey, {
        count: 1,
        resetAt: now + rule.windowMs,
      });
      next();
      return;
    }

    if (currentBucket.count >= rule.maxRequests) {
      next(createHttpError(429, rule.errorCode, rule.message));
      return;
    }

    currentBucket.count += 1;
    next();
  };
}

function isValidClaimCode(claimCode: string): boolean {
  return claimCodePattern.test(claimCode);
}

function readSingleRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function assertValidClaimCode(claimCode: string) {
  if (!isValidClaimCode(claimCode)) {
    throw createHttpError(
      400,
      "invalid_claim_code",
      "The claim code format is invalid.",
    );
  }
}

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

function parseRequiredInteger(
  fieldName: string,
  value: unknown,
  options: { max?: number; min?: number } = {},
) {
  const normalizedValue = (() => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (integerPattern.test(trimmedValue)) {
        return Number(trimmedValue);
      }
    }

    return Number.NaN;
  })();

  if (!Number.isSafeInteger(normalizedValue)) {
    throw createHttpError(400, `${fieldName}_invalid`, `${fieldName} must be an integer.`);
  }

  if (typeof options.min === "number" && normalizedValue < options.min) {
    throw createHttpError(
      400,
      `${fieldName}_out_of_range`,
      `${fieldName} must be greater than or equal to ${options.min}.`,
    );
  }

  if (typeof options.max === "number" && normalizedValue > options.max) {
    throw createHttpError(
      400,
      `${fieldName}_out_of_range`,
      `${fieldName} must be less than or equal to ${options.max}.`,
    );
  }

  return normalizedValue;
}

function parseBooleanFlag(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (typeof value === "undefined") {
    return false;
  }

  throw createHttpError(400, "invalid_boolean_flag", "Boolean flag is invalid.");
}

function parseAppMode(value: unknown): "web" | "arcade" {
  return value === "arcade" ? "arcade" : "web";
}

export function createApp(
  dependencies: Partial<BackendAppDependencies> = {},
): Express {
  const auth = dependencies.auth ?? getAuth();
  const authRouteHandler = dependencies.authRouteHandler ?? toNodeHandler(auth);
  const db = dependencies.db ?? getDb();
  const env = dependencies.env ?? defaultEnv;
  const getSession =
    dependencies.getSession ??
    // L'application n'a besoin que d'une forme minimale de session.
    // On évite donc d'imposer le type complet Better Auth aux helpers de test.
    (async (headers: IncomingHttpHeaders) =>
      (await auth.api.getSession({
        headers: fromNodeHeaders(headers),
      })) as AppSession | null);

  const app = express();

  // Cette fonction est la future porte d'entrée des tests d'intégration.
  // Les tests pourront importer l'app sans déclencher `listen()`.
  app.set("trust proxy", env.trustProxy);

  async function wouldScoreEnterLeaderboard(finalScore: number) {
    const topGames = await db
      .select({
        finalScore: games.finalScore,
      })
      .from(games)
      .orderBy(desc(games.finalScore), desc(games.playedAt))
      .limit(LEADERBOARD_LIMIT);

    if (topGames.length < LEADERBOARD_LIMIT) {
      return true;
    }

    const cutoffScore = topGames.at(-1)?.finalScore;

    if (typeof cutoffScore !== "number") {
      return true;
    }

    return finalScore >= cutoffScore;
  }

  async function expirePendingScoreClaimIfNeeded(
    claimCode: string,
    status: ScoreClaimStatus,
    expiresAt: Date,
  ): Promise<ScoreClaimStatus> {
    if (status !== scoreClaimStatus.pending || !isExpired(expiresAt)) {
      return status;
    }

    // L'expiration doit être reflétée en base, sinon deux lectures
    // successives pourraient raconter deux histoires différentes.
    await db
      .update(scoreClaimRequests)
      .set({
        status: scoreClaimStatus.expired,
      })
      .where(
        and(
          eq(scoreClaimRequests.claimCode, claimCode),
          eq(scoreClaimRequests.status, scoreClaimStatus.pending),
        ),
      );

    return scoreClaimStatus.expired;
  }

  const limitScoreClaimStart = createRateLimitMiddleware({
    keyPrefix: "score-claim-start",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    errorCode: "too_many_score_claim_starts",
    message: "Too many score claim start requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitScoreClaimStatusByIp = createRateLimitMiddleware({
    keyPrefix: "score-claim-status-ip",
    maxRequests: 120,
    windowMs: 60 * 1000,
    errorCode: "too_many_score_claim_status_requests",
    message: "Too many score claim status requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitScoreClaimStatusByCode = createRateLimitMiddleware({
    keyPrefix: "score-claim-status-code",
    maxRequests: 30,
    windowMs: 60 * 1000,
    errorCode: "too_many_score_claim_status_requests",
    message: "Too many score claim status requests for this claim code.",
    resolveKey: (request) =>
      readSingleRouteParam(request.params.claimCode) || "missing-claim-code",
  });

  const limitScoreClaimApproveByIp = createRateLimitMiddleware({
    keyPrefix: "score-claim-approve-ip",
    maxRequests: 20,
    windowMs: 5 * 60 * 1000,
    errorCode: "too_many_score_claim_approve_requests",
    message: "Too many score claim approve requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitScoreClaimApproveByCode = createRateLimitMiddleware({
    keyPrefix: "score-claim-approve-code",
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    errorCode: "too_many_score_claim_approve_requests",
    message: "Too many score claim approve requests for this claim code.",
    resolveKey: (request) =>
      String(request.body?.claimCode ?? "missing-claim-code"),
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.frontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(
          createHttpError(
            403,
            "cors_origin_not_allowed",
            `Origin ${origin} is not allowed by CORS.`,
          ),
        );
      },
      credentials: true,
    }),
  );

  // Better Auth doit être monté avant `express.json()`.
  // Cela lui laisse la main sur son propre parsing et son propre routage.
  app.all("/api/auth/*splat", authRouteHandler);

  app.use(express.json());

  app.get("/health", async (_request, response) => {
    try {
      await db.execute(sql`select 1`);

      response.json({
        status: "ok",
        database: "connected",
      });
    } catch (error) {
      console.error("Health check failed:", error);
      response.status(500).json({
        status: "error",
        database: "disconnected",
      });
    }
  });

  app.get("/api/me", async (request, response) => {
    try {
      const session = await getSession(request.headers);

      if (!session) {
        response.status(401).json({ authenticated: false });
        return;
      }

      response.json({
        authenticated: true,
        session,
      });
    } catch (error) {
      console.error("Session lookup failed:", error);
      response.status(500).json({
        authenticated: false,
        error: "session_lookup_failed",
      });
    }
  });

  app.post(
    "/api/score-claims/start",
    limitScoreClaimStart,
    async (request, response) => {
      const finalScore = parseRequiredInteger("finalScore", request.body?.finalScore, {
        max: postgresIntegerMax,
        min: 0,
      });
      const playedDurationSeconds = parseRequiredInteger(
        "playedDurationSeconds",
        request.body?.playedDurationSeconds,
        { max: postgresIntegerMax, min: 0 },
      );
      const requestClaim = parseBooleanFlag(request.body?.requestClaim);
      const mode = parseAppMode(request.body?.mode);
      const session = await getSession(request.headers);

      const shouldCheckLeaderboard = !session && !requestClaim;
      const leaderboardEligible = shouldCheckLeaderboard
        ? await wouldScoreEnterLeaderboard(finalScore)
        : false;

      const evaluation = evaluateScorePersistence({
        finalScore,
        isAuthenticated: Boolean(session),
        mode,
        playedDurationSeconds,
        requestClaim,
        wouldEnterLeaderboard: leaderboardEligible,
      });

      if (evaluation.decision === "discard") {
        response.json({
          decision: evaluation.decision,
          reason: evaluation.reason,
          game: null,
          claim: null,
        });
        return;
      }

      const playedAt = new Date();
      const [persistedGame, persistedClaim] = await db.transaction(async (tx) => {
        const [createdGame] = await tx
          .insert(games)
          .values({
            userId: session?.user.id ?? null,
            playedDurationSeconds,
            finalScore,
            playedAt,
          })
          .returning({
            id: games.id,
            finalScore: games.finalScore,
            playedAt: games.playedAt,
            playedDurationSeconds: games.playedDurationSeconds,
          });

        if (evaluation.decision !== "save_and_claimable") {
          return [createdGame, null] as const;
        }

        const claimCode = createScoreClaimCode();
        const expiresAt = new Date(Date.now() + SCORE_CLAIM_TTL_MS);

        const [createdClaim] = await tx
          .insert(scoreClaimRequests)
          .values({
            id: randomUUID(),
            gameId: createdGame.id,
            claimCode,
            status: scoreClaimStatus.pending,
            expiresAt,
          })
          .returning({
            claimCode: scoreClaimRequests.claimCode,
            expiresAt: scoreClaimRequests.expiresAt,
          });

        return [createdGame, createdClaim] as const;
      });

      response.status(201).json({
        decision: evaluation.decision,
        reason: evaluation.reason,
        game: {
          id: persistedGame.id,
          finalScore: persistedGame.finalScore,
          playedAt: persistedGame.playedAt.toISOString(),
          playedDurationSeconds: persistedGame.playedDurationSeconds,
        },
        claim: persistedClaim
          ? {
              claimCode: persistedClaim.claimCode,
              expiresAt: persistedClaim.expiresAt.toISOString(),
              status: scoreClaimStatus.pending,
              verificationUrl: getScoreClaimVerificationUrl(
                env.frontendUrl,
                persistedClaim.claimCode,
              ),
            }
          : null,
      });
    },
  );

  app.get(
    "/api/score-claims/status/:claimCode",
    limitScoreClaimStatusByIp,
    limitScoreClaimStatusByCode,
    async (request, response) => {
      const claimCode = readSingleRouteParam(request.params.claimCode);

      assertValidClaimCode(claimCode);

      const [scoreClaim] = await db
        .select({
          status: scoreClaimRequests.status,
          expiresAt: scoreClaimRequests.expiresAt,
          approvedAt: scoreClaimRequests.approvedAt,
          userId: scoreClaimRequests.userId,
          username: users.username,
          gameId: games.id,
          finalScore: games.finalScore,
          playedAt: games.playedAt,
          playedDurationSeconds: games.playedDurationSeconds,
        })
        .from(scoreClaimRequests)
        .innerJoin(games, eq(scoreClaimRequests.gameId, games.id))
        .leftJoin(users, eq(scoreClaimRequests.userId, users.id))
        .where(eq(scoreClaimRequests.claimCode, claimCode))
        .limit(1);

      if (!scoreClaim) {
        response.status(404).json({ status: "not_found" });
        return;
      }

      const effectiveStatus = await expirePendingScoreClaimIfNeeded(
        claimCode,
        scoreClaim.status,
        scoreClaim.expiresAt,
      );

      if (effectiveStatus === scoreClaimStatus.expired) {
        response.status(410).json({ status: "expired" });
        return;
      }

      response.json({
        status: effectiveStatus,
        user: scoreClaim.userId
          ? {
              username: scoreClaim.username,
            }
          : null,
        game: {
          id: scoreClaim.gameId,
          finalScore: scoreClaim.finalScore,
          playedAt: scoreClaim.playedAt.toISOString(),
          playedDurationSeconds: scoreClaim.playedDurationSeconds,
        },
        approvedAt: scoreClaim.approvedAt?.toISOString() ?? null,
        expiresAt: scoreClaim.expiresAt.toISOString(),
      });
    },
  );

  app.post(
    "/api/score-claims/approve",
    limitScoreClaimApproveByIp,
    limitScoreClaimApproveByCode,
    async (request, response) => {
      const claimCode = String(request.body?.claimCode ?? "");

      if (!claimCode) {
        response.status(400).json({ error: "claim_code_required" });
        return;
      }

      assertValidClaimCode(claimCode);

      const session = await getSession(request.headers);

      if (!session) {
        response.status(401).json({ error: "authentication_required" });
        return;
      }

      const approvalResult = await db.transaction(async (tx) => {
        // On approuve d'abord le claim, puis on rattache la partie.
        // La transaction garantit qu'aucune requête concurrente ne laisse
        // un état intermédiaire incohérent.
        const [approvedClaim] = await tx
          .update(scoreClaimRequests)
          .set({
            status: scoreClaimStatus.approved,
            userId: session.user.id,
            approvedAt: new Date(),
          })
          .where(
            and(
              eq(scoreClaimRequests.claimCode, claimCode),
              eq(scoreClaimRequests.status, scoreClaimStatus.pending),
              gt(scoreClaimRequests.expiresAt, new Date()),
            ),
          )
          .returning({
            gameId: scoreClaimRequests.gameId,
          });

        if (approvedClaim) {
          const [claimedGame] = await tx
            .update(games)
            .set({
              userId: session.user.id,
            })
            .where(
              and(
                eq(games.id, approvedClaim.gameId),
                isNull(games.userId),
              ),
            )
            .returning({
              id: games.id,
              finalScore: games.finalScore,
            });

          if (!claimedGame) {
            throw createHttpError(
              409,
              "score_claim_game_already_owned",
              "The score claim game is already attached to a user.",
            );
          }

          return {
            kind: "approved" as const,
            game: claimedGame,
          };
        }

        const [existingClaim] = await tx
          .select({
            status: scoreClaimRequests.status,
            expiresAt: scoreClaimRequests.expiresAt,
            gameId: scoreClaimRequests.gameId,
            finalScore: games.finalScore,
          })
          .from(scoreClaimRequests)
          .innerJoin(games, eq(scoreClaimRequests.gameId, games.id))
          .where(eq(scoreClaimRequests.claimCode, claimCode))
          .limit(1);

        if (!existingClaim) {
          return { kind: "missing" as const };
        }

        if (
          existingClaim.status === scoreClaimStatus.pending &&
          isExpired(existingClaim.expiresAt)
        ) {
          await tx
            .update(scoreClaimRequests)
            .set({
              status: scoreClaimStatus.expired,
            })
            .where(
              and(
                eq(scoreClaimRequests.claimCode, claimCode),
                eq(scoreClaimRequests.status, scoreClaimStatus.pending),
              ),
            );

          return { kind: "expired" as const };
        }

        if (existingClaim.status === scoreClaimStatus.approved) {
          return {
            kind: "already-approved" as const,
            game: {
              id: existingClaim.gameId,
              finalScore: existingClaim.finalScore,
            },
          };
        }

        return { kind: "conflict" as const };
      });

      if (
        approvalResult.kind === "approved" ||
        approvalResult.kind === "already-approved"
      ) {
        response.json({
          status: scoreClaimStatus.approved,
          game: approvalResult.game,
        });
        return;
      }

      if (approvalResult.kind === "missing") {
        response.status(404).json({ error: "score_claim_not_found" });
        return;
      }

      if (approvalResult.kind === "expired") {
        response.status(410).json({ error: "score_claim_expired" });
        return;
      }

      throw createHttpError(
        409,
        "score_claim_approval_conflict",
        "The score claim request could not be approved safely.",
      );
    },
  );

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      if (response.headersSent) {
        next(error);
        return;
      }

      if (isInvalidJsonError(error)) {
        response.status(400).json({ error: "invalid_json_body" });
        return;
      }

      if (isHttpError(error)) {
        const status = error.status ?? 500;

        if (status >= 500) {
          console.error("Unhandled request error:", error);
        }

        response.status(status).json({
          error: error.code ?? "internal_server_error",
        });
        return;
      }

      console.error("Unhandled request error:", error);
      response.status(500).json({ error: "internal_server_error" });
    },
  );

  return app;
}

export function startServer(app: Express, port: number) {
  return app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
