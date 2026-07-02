import type { Express } from "express";
import { asc, desc, eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client.js";
import { games, users } from "../db/schema.js";

const LEADERBOARD_DISPLAY_LIMIT = 10;

type RegisterLeaderboardRoutesDependencies = {
  app: Express;
  db: DatabaseClient;
};

export function registerLeaderboardRoutes({
  app,
  db,
}: RegisterLeaderboardRoutesDependencies) {
  app.get("/api/leaderboard", async (_request, response) => {
    const topGames = await db
      .select({
        finalScore: games.finalScore,
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
      name: game.displayUsername ?? game.username ?? "Anonyme",
    }));

    response.json({ entries });
  });
}
