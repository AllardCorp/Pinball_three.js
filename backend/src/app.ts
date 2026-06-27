import cors from "cors";
import express, {
  type Express,
  type RequestHandler,
} from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { sql } from "drizzle-orm";

import type { AppSession, GetSession } from "./app-session.js";
import { getAuth, type AuthInstance } from "./auth.js";
import { getDb, type DatabaseClient } from "./db/client.js";
import { env as defaultEnv } from "./env.js";
import { createHttpError, requestErrorHandler } from "./http/errors.js";
import { resetRateLimitStoreForTests } from "./http/rate-limit.js";
import { registerScoreClaimRoutes } from "./routes/score-claim-routes.js";
import {
  startRemoteScoreClaim,
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

  app.use(express.json());

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

  registerScoreClaimRoutes({
    // Les routes score-claim sont regroupées dans leur propre module parce
    // qu'elles contiennent la majorité de la logique métier QR/VPS.
    app,
    db,
    env,
    getSession,
    remoteScoreClaimStarter,
  });

  // Le gestionnaire d'erreurs doit rester le dernier middleware Express.
  // Toutes les routes au-dessus peuvent lever `createHttpError(...)`.
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
