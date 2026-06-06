import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../env.js";
import * as schema from "./schema.js";

export function createPoolConnection(databaseUrl: string) {
  // Le pool est volontairement construit via une factory pour permettre
  // aux tests d'injecter une base jetable sans toucher à la base de dev.
  return new Pool({
    connectionString: databaseUrl,
  });
}

export function createDatabaseClient(pool: Pool) {
  // Le client Drizzle ne fait qu'encapsuler le pool Postgres.
  // Le séparer ainsi simplifie l'injection dans `auth` et dans `app`.
  return drizzle(pool, { schema });
}

let defaultPool: Pool | null = null;
let defaultDb: ReturnType<typeof createDatabaseClient> | null = null;

export function getPool() {
  if (!defaultPool) {
    defaultPool = createPoolConnection(env.databaseUrl);
  }

  return defaultPool;
}

export function getDb() {
  if (!defaultDb) {
    defaultDb = createDatabaseClient(getPool());
  }

  return defaultDb;
}

export type DatabasePool = ReturnType<typeof createPoolConnection>;
export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
