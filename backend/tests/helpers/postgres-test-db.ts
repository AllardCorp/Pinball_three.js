import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { PoolClient } from "pg";

import {
  createDatabaseClient,
  createPoolConnection,
  type DatabaseClient,
  type DatabasePool,
} from "../../src/db/client.js";

type TestDatabaseContext = {
  databaseName: string;
  databaseUrl: string;
  db: DatabaseClient;
  pool: DatabasePool;
  teardown: () => Promise<void>;
};

function toReadableDatabaseError(error: unknown): Error {
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "ECONNREFUSED"
  ) {
    return new Error(
      "Connexion refusée à PostgreSQL de test. Vérifiez que le service `postgres` tourne bien et que DATABASE_URL_TEST pointe vers localhost:5432. Depuis la racine du projet : `docker compose -f compose.dev.yml up -d postgres`.",
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

function getRequiredTestDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL_TEST?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_TEST est requis pour les tests d'intégration afin d'éviter toute écriture dans la base de développement.",
    );
  }

  return databaseUrl;
}

function getMigrationStatements() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const backendRoot = path.resolve(path.dirname(currentFilePath), "..", "..");
  const drizzleDirectory = path.join(backendRoot, "drizzle");

  return readdirSync(drizzleDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .flatMap((fileName) => {
      const sqlFile = readFileSync(path.join(drizzleDirectory, fileName), "utf8");
      return sqlFile
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean);
    });
}

async function applyMigrations(client: PoolClient) {
  for (const statement of getMigrationStatements()) {
    await client.query(statement);
  }
}

export async function createPostgresTestDatabase(): Promise<TestDatabaseContext> {
  // On crée une base dédiée par suite pour garantir l'isolation des tests.
  // C'est plus lent qu'un simple truncate, mais bien plus sûr pour éviter
  // qu'un test hérite silencieusement des données d'un autre.
  const baseUrl = new URL(getRequiredTestDatabaseUrl());
  const databaseName = `pinball_test_${randomUUID().replace(/-/g, "")}`;
  const testDatabaseUrl = new URL(baseUrl.toString());
  testDatabaseUrl.pathname = `/${databaseName}`;

  const adminUrl = new URL(baseUrl.toString());
  adminUrl.pathname = "/postgres";

  const adminPool = createPoolConnection(adminUrl.toString());

  try {
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);
  } catch (error) {
    await adminPool.end();
    throw toReadableDatabaseError(error);
  }

  const pool = createPoolConnection(testDatabaseUrl.toString());
  const db = createDatabaseClient(pool);

  const migrationClient = await pool.connect();

  try {
    await applyMigrations(migrationClient);
  } finally {
    migrationClient.release();
    await adminPool.end();
  }

  return {
    databaseName,
    databaseUrl: testDatabaseUrl.toString(),
    db,
    pool,
    teardown: async () => {
      await pool.end();

      const cleanupPool = createPoolConnection(adminUrl.toString());

      try {
        await cleanupPool.query(
          `
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1
              AND pid <> pg_backend_pid()
          `,
          [databaseName],
        );
        await cleanupPool.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      } finally {
        await cleanupPool.end();
      }
    },
  };
}
