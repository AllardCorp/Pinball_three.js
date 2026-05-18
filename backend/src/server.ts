import cors from "cors";
import express from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

import { auth } from "./auth.js";
import { db, pool } from "./db/client.js";
import { deviceLoginRequests, users } from "./db/schema.js";
import { env } from "./env.js";

const app = express();
const deviceLoginTtlMs = 30 * 60 * 1000;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);

// Better Auth doit etre monte avant express.json()
// pour laisser la librairie gerer correctement ses propres requetes.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

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

app.post("/api/device-login/start", async (_request, response) => {
  const deviceCode = createDeviceCode();
  const expiresAt = new Date(Date.now() + deviceLoginTtlMs);

  await db.insert(deviceLoginRequests).values({
    id: randomUUID(),
    deviceCode,
    expiresAt,
  });

  response.status(201).json({
    deviceCode,
    verificationUrl: getDeviceLoginUrl(deviceCode),
    expiresAt: expiresAt.toISOString(),
  });
});

app.get("/api/device-login/status/:deviceCode", async (request, response) => {
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
    .where(eq(deviceLoginRequests.deviceCode, request.params.deviceCode))
    .limit(1);

  if (!deviceLogin) {
    response.status(404).json({ status: "not_found" });
    return;
  }

  if (isExpired(deviceLogin.expiresAt) && deviceLogin.status !== "approved") {
    response.status(410).json({ status: "expired" });
    return;
  }

  response.json({
    status: deviceLogin.status,
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
});

app.post("/api/device-login/approve", async (request, response) => {
  const deviceCode = String(request.body?.deviceCode ?? "");

  if (!deviceCode) {
    response.status(400).json({ error: "device_code_required" });
    return;
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    response.status(401).json({ error: "authentication_required" });
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

  if (isExpired(deviceLogin.expiresAt)) {
    response.status(410).json({ error: "device_login_expired" });
    return;
  }

  if (deviceLogin.status === "approved") {
    response.json({ status: "approved" });
    return;
  }

  await db
    .update(deviceLoginRequests)
    .set({
      status: "approved",
      userId: session.user.id,
      approvedAt: new Date(),
    })
    .where(eq(deviceLoginRequests.deviceCode, deviceCode));

  response.json({ status: "approved" });
});

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});

async function shutdown() {
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
