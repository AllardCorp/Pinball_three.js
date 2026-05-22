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

export const pool = createPoolConnection(env.databaseUrl);
export const db = createDatabaseClient(pool);

export type DatabasePool = typeof pool;
export type DatabaseClient = typeof db;
