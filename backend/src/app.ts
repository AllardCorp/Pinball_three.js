import cors from "cors";
import express, {
  type Express,
  type RequestHandler,
} from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { desc, eq, sql } from "drizzle-orm";

import type { AppSession, GetSession } from "./app-session.js";
import { getAuth, type AuthInstance } from "./auth.js";
import { getDb, type DatabaseClient } from "./db/client.js";
import { levels } from "./db/schema.js";
import { env as defaultEnv } from "./env.js";
import { createHttpError, requestErrorHandler } from "./http/errors.js";
import { readSingleRouteParam } from "./http/request-parsing.js";
import { resetRateLimitStoreForTests } from "./http/rate-limit.js";
import { registerLeaderboardRoutes } from "./routes/leaderboard-routes.js";
import { registerScoreClaimRoutes } from "./routes/score-claim-routes.js";
import {
  getRemoteScoreClaimStatus,
  startRemoteScoreClaim,
  type RemoteScoreClaimStatusChecker,
  type RemoteScoreClaimStarter,
} from "./services/remote-score-claim-client.js";

// `app.ts` assemble l'application Express.
// Les règles métier lourdes restent dans des modules dédiés afin d'éviter
// qu'Express, Better Auth, la base de données et le score-claim soient tous
// mélangés dans un seul fichier.
type BackendAppDependencies = {
  auth: AuthInstance;
  authRouteHandler: RequestHandler;
  db: DatabaseClient;
  env: typeof defaultEnv;
  getSession: GetSession;
  remoteScoreClaimStatusChecker: RemoteScoreClaimStatusChecker;
  remoteScoreClaimStarter: RemoteScoreClaimStarter;
};

export { resetRateLimitStoreForTests };

export function createApp(
  dependencies: Partial<BackendAppDependencies> = {},
): Express {
  // Toutes les dépendances importantes sont injectables.
  // Cela permet aux tests de remplacer la base, l'authentification ou l'appel
  // VPS sans lancer de serveur réel ni toucher aux services externes.
  const auth = dependencies.auth ?? getAuth();
  const authRouteHandler = dependencies.authRouteHandler ?? toNodeHandler(auth);
  const db = dependencies.db ?? getDb();
  const env = dependencies.env ?? defaultEnv;
  const remoteScoreClaimStarter =
    dependencies.remoteScoreClaimStarter ?? startRemoteScoreClaim;
  const remoteScoreClaimStatusChecker =
    dependencies.remoteScoreClaimStatusChecker ?? getRemoteScoreClaimStatus;
  const getSession =
    dependencies.getSession ??
    // L'application n'a besoin que d'une forme minimale de session.
    // On évite donc d'imposer le type complet Better Auth aux helpers de test.
    (async (headers) =>
      (await auth.api.getSession({
        headers: fromNodeHeaders(headers),
      })) as AppSession | null);

  const app = express();

  // `createApp` reste le point d'entrée des tests : importer l'app ne doit pas
  // lancer de serveur réseau ni ouvrir de port automatiquement.
  app.set("trust proxy", env.trustProxy);

  app.use(
    cors({
      origin(origin, callback) {
        // Les requêtes sans `origin` correspondent souvent à curl, healthcheck
        // ou appels server-to-server. Les navigateurs, eux, doivent venir d'une
        // origine explicitement autorisée.
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

  app.use(express.json({ limit: "10mb" }));

  const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
  app.use("/screenshots", express.static(path.join(process.cwd(), "public", "screenshots")));

  app.get("/health", async (_request, response) => {
    try {
      // Healthcheck utilisé par Docker ou par un futur reverse proxy.
      // On teste réellement PostgreSQL pour détecter une app démarrée mais
      // incapable de lire/écrire ses données.
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
      // Route légère utilisée par le frontend pour savoir si une session existe.
      // Elle ne déclenche pas de logique métier et reste séparée de Better Auth.
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

  registerLeaderboardRoutes({ app, db });

  registerScoreClaimRoutes({
    // Les routes score-claim sont regroupées dans leur propre module parce
    // qu'elles contiennent la majorité de la logique métier QR/VPS.
    app,
    db,
    env,
    getSession,
    remoteScoreClaimStatusChecker,
    remoteScoreClaimStarter,
  });


  // ─── Levels ──────────────────────────────────────────────────────────────────

  app.get("/api/levels", async (_request, response) => {
    const rows = await db
      .select({
        id: levels.id,
        name: levels.name,
        screenshotUrl: levels.screenshotUrl,
        createdAt: levels.createdAt,
        updatedAt: levels.updatedAt,
      })
      .from(levels)
      .orderBy(desc(levels.createdAt));

    response.json(rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  });

  app.get("/api/levels/:id", async (request, response) => {
    const id = readSingleRouteParam(request.params.id);

    const [level] = await db
      .select()
      .from(levels)
      .where(eq(levels.id, id))
      .limit(1);

    if (!level) {
      response.status(404).json({ error: "level_not_found" });
      return;
    }

    response.json({
      ...level,
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    });
  });

  app.post("/api/levels", async (request, response) => {
    const name = String(request.body?.name ?? "").trim();
    if (!name) {
      throw createHttpError(400, "level_name_required", "Le nom du niveau est requis.");
    }

    const elements = request.body?.elements;
    if (!Array.isArray(elements)) {
      throw createHttpError(400, "level_elements_invalid", "Les éléments doivent être un tableau.");
    }

    const screenshotData: string | undefined = request.body?.screenshot;
    const id = randomUUID();
    let screenshotUrl: string | null = null;

    if (screenshotData && screenshotData.startsWith("data:image/jpeg;base64,")) {
      const base64 = screenshotData.replace("data:image/jpeg;base64,", "");
      const buffer = Buffer.from(base64, "base64");
      await mkdir(screenshotsDir, { recursive: true });
      await writeFile(path.join(screenshotsDir, `${id}.jpg`), buffer);
      screenshotUrl = `/screenshots/${id}.jpg`;
    }

    const now = new Date();
    const [created] = await db
      .insert(levels)
      .values({
        id,
        name,
        elements,
        screenshotUrl,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: levels.id,
        name: levels.name,
        screenshotUrl: levels.screenshotUrl,
        createdAt: levels.createdAt,
        updatedAt: levels.updatedAt,
      });

    response.status(201).json({
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  });

  app.delete("/api/levels/:id", async (request, response) => {
    const id = readSingleRouteParam(request.params.id);

    const [deleted] = await db
      .delete(levels)
      .where(eq(levels.id, id))
      .returning({ screenshotUrl: levels.screenshotUrl });

    if (!deleted) {
      response.status(404).json({ error: "level_not_found" });
      return;
    }

    if (deleted.screenshotUrl) {
      const filePath = path.join(screenshotsDir, path.basename(deleted.screenshotUrl));
      await unlink(filePath).catch(() => undefined);
    }

    response.status(204).send();
  });

  app.use(requestErrorHandler);


  return app;
}

export function startServer(app: Express, port: number) {
  // Séparé de `createApp` pour que les tests puissent importer l'application
  // sans ouvrir de port réseau.
  return app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
