import express from "express";
import { sql } from "drizzle-orm";

import { db, pool } from "./db/client.js";
import { env } from "./env.js";

const app = express();

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

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});

async function shutdown() {
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
