import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

import type { AppSession, GetSession } from "../app-session.js";
import type { DatabaseClient } from "../db/client.js";
import {
  games,
  scoreClaimRequests,
  type ScoreClaimStatus,
  users,
} from "../db/schema.js";
import type { env as defaultEnv } from "../env.js";
import { readBearerToken, tokensMatch } from "../http/bearer-token.js";
import { createHttpError } from "../http/errors.js";
import {
  getClientIp,
  createRateLimitMiddleware,
} from "../http/rate-limit.js";
import {
  parseBooleanFlag,
  parseRequiredInteger,
  postgresIntegerMax,
  readSingleRouteParam,
} from "../http/request-parsing.js";
import type { RemoteScoreClaimStarter } from "../services/remote-score-claim-client.js";
import {
  LEADERBOARD_LIMIT,
  SCORE_CLAIM_TTL_MS,
  type ScoreClaimStartPayload,
  type ScoreClaimStartResponse,
  createScoreClaimCode,
  evaluateScorePersistence,
  getScoreClaimVerificationUrl,
} from "../services/score-claim-service.js";

// Ce module regroupe tout le flux "score claim".
// Il a été sorti de `app.ts` pour garder `app.ts` comme fichier d'assemblage
// Express, tandis qu'ici on garde les règles métier liées au QR code, au VPS
// et au rattachement d'un score à un utilisateur.
type RegisterScoreClaimRoutesDependencies = {
  app: Express;
  db: DatabaseClient;
  env: typeof defaultEnv;
  getSession: GetSession;
  remoteScoreClaimStarter: RemoteScoreClaimStarter;
};

const claimCodeLength = 32;

// Copie locale des statuts autorisés par le schéma.
// `satisfies` garantit que si le type Drizzle évolue, TypeScript nous force
// à mettre ce mapping à jour.
const scoreClaimStatus = {
  pending: "pending",
  approved: "approved",
  expired: "expired",
} as const satisfies Record<ScoreClaimStatus, ScoreClaimStatus>;

function isClaimCodeCharacter(character: string): boolean {
  const isUppercaseLetter = character >= "A" && character <= "Z";
  const isLowercaseLetter = character >= "a" && character <= "z";
  const isDigit = character >= "0" && character <= "9";

  return (
    isUppercaseLetter ||
    isLowercaseLetter ||
    isDigit ||
    character === "_" ||
    character === "-"
  );
}

function isValidClaimCode(claimCode: string): boolean {
  // Les claim codes sont générés côté serveur. En entrée utilisateur, on valide
  // strictement la taille et l'alphabet autorisé avant toute requête SQL.
  if (claimCode.length !== claimCodeLength) {
    return false;
  }

  for (const character of claimCode) {
    if (!isClaimCodeCharacter(character)) {
      return false;
    }
  }

  return true;
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

function parseAppMode(value: unknown): "web" | "arcade" {
  // Par défaut on considère le mode web : seul `arcade` déclenche le flux QR
  // destiné à une borne physique.
  return value === "arcade" ? "arcade" : "web";
}

function parseScoreClaimStartPayload(body: unknown): ScoreClaimStartPayload {
  // Toutes les routes de démarrage de claim partagent le même parsing.
  // Cela évite qu'une borne remote et le backend local interprètent différemment
  // le score, la durée ou le mode de jeu.
  const requestBody =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  return {
    finalScore: parseRequiredInteger("finalScore", requestBody.finalScore, {
      max: postgresIntegerMax,
      min: 0,
    }),
    mode: parseAppMode(requestBody.mode),
    playedDurationSeconds: parseRequiredInteger(
      "playedDurationSeconds",
      requestBody.playedDurationSeconds,
      { max: postgresIntegerMax, min: 0 },
    ),
    requestClaim: parseBooleanFlag(requestBody.requestClaim),
  };
}

function getScoreClaimStartStatus(response: ScoreClaimStartResponse) {
  // Un score ignoré n'a rien créé en base : 200.
  // Un score sauvegardé ou claimable a créé une ressource : 201.
  return response.decision === "discard" ? 200 : 201;
}

export function registerScoreClaimRoutes({
  app,
  db,
  env,
  getSession,
  remoteScoreClaimStarter,
}: RegisterScoreClaimRoutesDependencies) {
  async function wouldScoreEnterLeaderboard(finalScore: number) {
    // Pour un joueur non connecté qui ne réclame pas explicitement son score,
    // on sauvegarde seulement si le score peut entrer dans le leaderboard.
    // Cela évite de remplir la base avec des parties insignifiantes.
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

  async function startLocalScoreClaim(
    payload: ScoreClaimStartPayload,
    session: AppSession | null,
  ): Promise<ScoreClaimStartResponse> {
    // "Local" signifie : écrire dans la base du backend courant.
    // Sur le VPS c'est le comportement normal. Sur le flipper réel, on peut
    // basculer en mode remote pour que la source de vérité devienne le VPS.
    const shouldCheckLeaderboard = !session && !payload.requestClaim;
    const leaderboardEligible = shouldCheckLeaderboard
      ? await wouldScoreEnterLeaderboard(payload.finalScore)
      : false;

    const evaluation = evaluateScorePersistence({
      finalScore: payload.finalScore,
      isAuthenticated: Boolean(session),
      mode: payload.mode,
      playedDurationSeconds: payload.playedDurationSeconds,
      requestClaim: payload.requestClaim,
      wouldEnterLeaderboard: leaderboardEligible,
    });

    if (evaluation.decision === "discard") {
      // Aucun score ni claim n'est créé si les règles métier indiquent que la
      // partie n'est pas significative.
      return {
        claim: null,
        decision: evaluation.decision,
        game: null,
        reason: evaluation.reason,
      };
    }

    const playedAt = new Date();
    const [persistedGame, persistedClaim] = await db.transaction(async (tx) => {
      // La création du score et du claim doit être atomique :
      // on ne veut jamais un QR code sans partie associée, ni l'inverse.
      const [createdGame] = await tx
        .insert(games)
        .values({
          userId: session?.user.id ?? null,
          playedDurationSeconds: payload.playedDurationSeconds,
          finalScore: payload.finalScore,
          playedAt,
        })
        .returning({
          id: games.id,
          finalScore: games.finalScore,
          playedAt: games.playedAt,
          playedDurationSeconds: games.playedDurationSeconds,
        });

      if (evaluation.decision !== "save_and_claimable") {
        // Cas joueur déjà authentifié ou score leaderboard sans claim mobile.
        return [createdGame, null] as const;
      }

      const claimCode = createScoreClaimCode();
      const expiresAt = new Date(Date.now() + SCORE_CLAIM_TTL_MS);

      // Le claim est temporaire. Le téléphone scanne le QR, puis l'utilisateur
      // doit s'authentifier avant expiration pour rattacher la partie.
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

    return {
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
              // Cette URL doit être publique sur le VPS. En mode remote, elle
              // vient de la réponse VPS et non du localhost de la borne.
              env.frontendUrl,
              persistedClaim.claimCode,
            ),
          }
        : null,
    };
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
    // Protège la route appelée par le front/backglass local en fin de partie.
    keyPrefix: "score-claim-start",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    errorCode: "too_many_score_claim_starts",
    message: "Too many score claim start requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitBorneScoreClaimStart = createRateLimitMiddleware({
    // Route server-to-server exposée par le VPS. Elle a un quota plus élevé
    // parce qu'elle peut être appelée par une borne réelle, mais reste limitée.
    keyPrefix: "borne-score-claim-start",
    maxRequests: 60,
    windowMs: 10 * 60 * 1000,
    errorCode: "too_many_borne_score_claim_starts",
    message: "Too many borne score claim start requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitScoreClaimStatusByIp = createRateLimitMiddleware({
    // Le mobile peut poller le statut du claim ; on limite par IP.
    keyPrefix: "score-claim-status-ip",
    maxRequests: 120,
    windowMs: 60 * 1000,
    errorCode: "too_many_score_claim_status_requests",
    message: "Too many score claim status requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitScoreClaimStatusByCode = createRateLimitMiddleware({
    // On limite aussi par code pour éviter qu'un même QR soit martelé depuis
    // plusieurs clients ou onglets.
    keyPrefix: "score-claim-status-code",
    maxRequests: 30,
    windowMs: 60 * 1000,
    errorCode: "too_many_score_claim_status_requests",
    message: "Too many score claim status requests for this claim code.",
    resolveKey: (request) =>
      readSingleRouteParam(request.params.claimCode) || "missing-claim-code",
  });

  const limitScoreClaimApproveByIp = createRateLimitMiddleware({
    // L'approbation rattache un score à un compte utilisateur : c'est plus
    // sensible qu'une simple lecture de statut.
    keyPrefix: "score-claim-approve-ip",
    maxRequests: 20,
    windowMs: 5 * 60 * 1000,
    errorCode: "too_many_score_claim_approve_requests",
    message: "Too many score claim approve requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitScoreClaimApproveByCode = createRateLimitMiddleware({
    // Protection complémentaire sur le claim lui-même.
    keyPrefix: "score-claim-approve-code",
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    errorCode: "too_many_score_claim_approve_requests",
    message: "Too many score claim approve requests for this claim code.",
    resolveKey: (request) =>
      String(request.body?.claimCode ?? "missing-claim-code"),
  });

  app.post(
    "/api/score-claims/start",
    limitScoreClaimStart,
    async (request, response) => {
      const payload = parseScoreClaimStartPayload(request.body);

      if (env.scoreClaimMode === "remote") {
        // En mode remote, le backend local du flipper ne crée pas de QR local.
        // Il délègue au VPS, qui possède la base publique et l'URL scannable.
        if (!env.globalApiUrl || !env.borneToken) {
          throw createHttpError(
            503,
            "remote_score_claim_not_configured",
            "Remote score claim mode requires GLOBAL_API_URL and BORNE_TOKEN.",
          );
        }

        // En mode borne réelle, la base source de vérité est le VPS.
        // Le backend local relaie donc le score sans exposer BORNE_TOKEN au frontend.
        const remoteResult = await remoteScoreClaimStarter({
          borneToken: env.borneToken,
          globalApiUrl: env.globalApiUrl,
          payload,
        });

        response.status(getScoreClaimStartStatus(remoteResult)).json(remoteResult);
        return;
      }

      const session = await getSession(request.headers);
      const localResult = await startLocalScoreClaim(payload, session);

      response.status(getScoreClaimStartStatus(localResult)).json(localResult);
    },
  );

  app.post(
    "/api/borne/score-claims/start",
    limitBorneScoreClaimStart,
    async (request, response) => {
      if (!env.borneToken) {
        // Sur le VPS, cette route ne doit pas être ouverte tant que le secret
        // partagé avec la borne n'est pas configuré.
        throw createHttpError(
          503,
          "borne_token_not_configured",
          "BORNE_TOKEN is required to accept score claims from a physical cabinet.",
        );
      }

      const providedToken = readBearerToken(request.get("authorization"));

      if (!providedToken || !tokensMatch(providedToken, env.borneToken)) {
        // Le token est le seul droit accordé à la borne : créer un score invité.
        // Il ne donne jamais accès à une session utilisateur.
        throw createHttpError(
          401,
          "invalid_borne_token",
          "The physical cabinet token is invalid.",
        );
      }

      // Route publique du VPS pour les bornes autorisées.
      // Elle ne lit volontairement pas la session utilisateur : le joueur
      // s'authentifie ensuite sur /score-claim pour rattacher ce score.
      const payload = parseScoreClaimStartPayload(request.body);
      const localResult = await startLocalScoreClaim(payload, null);

      response.status(getScoreClaimStartStatus(localResult)).json(localResult);
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
        // On joint `games` pour renvoyer au mobile le score exact à afficher
        // pendant la validation, et `users` pour indiquer si le claim est déjà
        // attaché à un compte.
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
          // Le claim est bien en attente et pas expiré : on rattache maintenant
          // la partie au compte connecté.
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
          // Si l'update précédent n'a rien touché, on relit l'état exact pour
          // retourner une erreur métier compréhensible au client.
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
}
