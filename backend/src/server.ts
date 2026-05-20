import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";

import { auth } from "./auth.js";
import { db, pool } from "./db/client.js";
import {
  deviceLoginRequests,
  type DeviceLoginStatus,
  users,
} from "./db/schema.js";
import { env } from "./env.js";

const app = express();
const deviceLoginTtlMs = 15 * 60 * 1000;
const deviceCodePattern = /^[A-Za-z0-9_-]{32}$/;

const deviceLoginStatus = {
  pending: "pending",
  approved: "approved",
  expired: "expired",
} as const satisfies Record<DeviceLoginStatus, DeviceLoginStatus>;

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

const rateLimitStore = new Map<string, RateLimitBucket>();

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

function isValidDeviceCode(deviceCode: string): boolean {
  return deviceCodePattern.test(deviceCode);
}

function readSingleRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function assertValidDeviceCode(deviceCode: string) {
  if (!isValidDeviceCode(deviceCode)) {
    throw createHttpError(
      400,
      "invalid_device_code",
      "The device code format is invalid.",
    );
  }
}

function createDeviceCode() {
  return randomBytes(24).toString("base64url");
}

function getDeviceLoginUrl(deviceCode: string) {
  const url = new URL("/device-login", env.frontendUrl);
  url.searchParams.set("code", deviceCode);
  return url.toString();
}

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

async function expirePendingDeviceLoginIfNeeded(
  deviceCode: string,
  status: DeviceLoginStatus,
  expiresAt: Date,
): Promise<DeviceLoginStatus> {
  if (status !== deviceLoginStatus.pending || !isExpired(expiresAt)) {
    return status;
  }

  // Une demande expirée doit aussi être écrite en base pour garder un état
  // métier cohérent, même si l'expiration est détectée au moment de la lecture.
  await db
    .update(deviceLoginRequests)
    .set({
      status: deviceLoginStatus.expired,
    })
    .where(
      and(
        eq(deviceLoginRequests.deviceCode, deviceCode),
        eq(deviceLoginRequests.status, deviceLoginStatus.pending),
      ),
    );

  return deviceLoginStatus.expired;
}

const limitDeviceLoginStart = createRateLimitMiddleware({
  keyPrefix: "device-login-start",
  maxRequests: 8,
  windowMs: 10 * 60 * 1000,
  errorCode: "too_many_device_login_starts",
  message: "Too many device login start requests.",
  resolveKey: (request) => getClientIp(request),
});

const limitDeviceLoginStatusByIp = createRateLimitMiddleware({
  keyPrefix: "device-login-status-ip",
  maxRequests: 120,
  windowMs: 60 * 1000,
  errorCode: "too_many_device_login_status_requests",
  message: "Too many device login status requests.",
  resolveKey: (request) => getClientIp(request),
});

const limitDeviceLoginStatusByCode = createRateLimitMiddleware({
  keyPrefix: "device-login-status-code",
  maxRequests: 30,
  windowMs: 60 * 1000,
  errorCode: "too_many_device_login_status_requests",
  message: "Too many device login status requests for this device code.",
  resolveKey: (request) =>
    readSingleRouteParam(request.params.deviceCode) || "missing-device-code",
});

const limitDeviceLoginApproveByIp = createRateLimitMiddleware({
  keyPrefix: "device-login-approve-ip",
  maxRequests: 20,
  windowMs: 5 * 60 * 1000,
  errorCode: "too_many_device_login_approve_requests",
  message: "Too many device login approve requests.",
  resolveKey: (request) => getClientIp(request),
});

const limitDeviceLoginApproveByCode = createRateLimitMiddleware({
  keyPrefix: "device-login-approve-code",
  maxRequests: 10,
  windowMs: 5 * 60 * 1000,
  errorCode: "too_many_device_login_approve_requests",
  message: "Too many device login approve requests for this device code.",
  resolveKey: (request) =>
    String(request.body?.deviceCode ?? "missing-device-code"),
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

// Better Auth doit etre monte avant express.json()
// pour laisser la librairie gerer correctement ses propres requetes.
app.all("/api/auth/*splat", toNodeHandler(auth));

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
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

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
  "/api/device-login/start",
  limitDeviceLoginStart,
  async (_request, response) => {
    const deviceCode = createDeviceCode();
    const expiresAt = new Date(Date.now() + deviceLoginTtlMs);

    await db.insert(deviceLoginRequests).values({
      id: randomUUID(),
      deviceCode,
      status: deviceLoginStatus.pending,
      expiresAt,
    });

    response.status(201).json({
      deviceCode,
      verificationUrl: getDeviceLoginUrl(deviceCode),
      expiresAt: expiresAt.toISOString(),
    });
  },
);

app.get(
  "/api/device-login/status/:deviceCode",
  limitDeviceLoginStatusByIp,
  limitDeviceLoginStatusByCode,
  async (request, response) => {
    const deviceCode = readSingleRouteParam(request.params.deviceCode);

    assertValidDeviceCode(deviceCode);

    const [deviceLogin] = await db
      .select({
        status: deviceLoginRequests.status,
        expiresAt: deviceLoginRequests.expiresAt,
        approvedAt: deviceLoginRequests.approvedAt,
        userId: deviceLoginRequests.userId,
        userName: users.name,
        userEmail: users.email,
        username: users.username,
      })
      .from(deviceLoginRequests)
      .leftJoin(users, eq(deviceLoginRequests.userId, users.id))
      .where(eq(deviceLoginRequests.deviceCode, deviceCode))
      .limit(1);

    if (!deviceLogin) {
      response.status(404).json({ status: "not_found" });
      return;
    }

    const effectiveStatus = await expirePendingDeviceLoginIfNeeded(
      deviceCode,
      deviceLogin.status,
      deviceLogin.expiresAt,
    );

    if (effectiveStatus === deviceLoginStatus.expired) {
      response.status(410).json({ status: "expired" });
      return;
    }

    response.json({
      status: effectiveStatus,
      user: deviceLogin.userId
        ? {
            id: deviceLogin.userId,
            name: deviceLogin.userName,
            email: deviceLogin.userEmail,
            username: deviceLogin.username,
          }
        : null,
      approvedAt: deviceLogin.approvedAt?.toISOString() ?? null,
      expiresAt: deviceLogin.expiresAt.toISOString(),
    });
  },
);

app.post(
  "/api/device-login/approve",
  limitDeviceLoginApproveByIp,
  limitDeviceLoginApproveByCode,
  async (request, response) => {
    const deviceCode = String(request.body?.deviceCode ?? "");

    if (!deviceCode) {
      response.status(400).json({ error: "device_code_required" });
      return;
    }

    assertValidDeviceCode(deviceCode);

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      response.status(401).json({ error: "authentication_required" });
      return;
    }

    // L'approbation doit être atomique pour éviter qu'une seconde requête
    // concurrente n'écrase le `userId` de la première.
    const [approvedDeviceLogin] = await db
      .update(deviceLoginRequests)
      .set({
        status: deviceLoginStatus.approved,
        userId: session.user.id,
        approvedAt: new Date(),
      })
      .where(
        and(
          eq(deviceLoginRequests.deviceCode, deviceCode),
          eq(deviceLoginRequests.status, deviceLoginStatus.pending),
          gt(deviceLoginRequests.expiresAt, new Date()),
        ),
      )
      .returning({
        status: deviceLoginRequests.status,
      });

    if (approvedDeviceLogin) {
      response.json({ status: deviceLoginStatus.approved });
      return;
    }

    const [deviceLogin] = await db
      .select({
        expiresAt: deviceLoginRequests.expiresAt,
        status: deviceLoginRequests.status,
      })
      .from(deviceLoginRequests)
      .where(eq(deviceLoginRequests.deviceCode, deviceCode))
      .limit(1);

    if (!deviceLogin) {
      response.status(404).json({ error: "device_login_not_found" });
      return;
    }

    if (deviceLogin.status === deviceLoginStatus.approved) {
      response.json({ status: deviceLoginStatus.approved });
      return;
    }

    const effectiveStatus = await expirePendingDeviceLoginIfNeeded(
      deviceCode,
      deviceLogin.status,
      deviceLogin.expiresAt,
    );

    if (effectiveStatus === deviceLoginStatus.expired) {
      response.status(410).json({ error: "device_login_expired" });
      return;
    }

    throw createHttpError(
      409,
      "device_login_approval_conflict",
      "The device login request could not be approved safely.",
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

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});

async function shutdown() {
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
