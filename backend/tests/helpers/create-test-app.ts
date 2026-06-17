import { createApp } from "../../src/app.js";
import { env } from "../../src/env.js";
import { createAuth } from "../../src/auth.js";
import type { DatabaseClient } from "../../src/db/client.js";
import { createTestAuthHarness } from "./test-auth.js";

export function createTestApp(db: DatabaseClient) {
  const auth = createAuth({ db, env });
  const authHarness = createTestAuthHarness();

  return createApp({
    auth,
    authRouteHandler: authHarness.authRouteHandler,
    db,
    env,
    getSession: authHarness.getSession,
  });
}
