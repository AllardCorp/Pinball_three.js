import type { Express } from "express";
import { asc, desc, eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client.js";
import { games, users } from "../db/schema.js";
import type { env as defaultEnv } from "../env.js";

const LEADERBOARD_DISPLAY_LIMIT = 10;

type RegisterLeaderboardRoutesDependencies = {
  app: Express;
  db: DatabaseClient;
  env: typeof defaultEnv;
};

export function registerLeaderboardRoutes({
  app,
  db,
  env,
}: RegisterLeaderboardRoutesDependencies) {
  app.get("/api/leaderboard", async (_request, response) => {
    if (env.scoreClaimMode === "remote" && env.globalApiUrl) {
      // En mode remote, les scores sont sauvés sur le VPS, pas en base locale.
      // On proxie la requête vers le VPS pour afficher le vrai leaderboard.
      const remoteResponse = await fetch(
        new URL("api/leaderboard", env.globalApiUrl).toString(),
      );
      const remoteData = await remoteResponse.json();
      response.json(remoteData);
      return;
    }

    const topGames = await db
      .select({
        finalScore: games.finalScore,
        name: users.name,
        username: users.username,
        displayUsername: users.displayUsername,
      })
      .from(games)
      .leftJoin(users, eq(games.userId, users.id))
      .orderBy(desc(games.finalScore), asc(games.playedAt))
      .limit(LEADERBOARD_DISPLAY_LIMIT);

    const entries = topGames.map((game, index) => ({
      rank: index + 1,
      score: game.finalScore,
      displayUsername: game.displayUsername ?? game.username ?? "Anonyme",
      username: game.username,
      name: game.name ?? game.displayUsername ?? game.username ?? "Anonyme"
    }));

    response.json({ entries });
  });
}
