import { createApp } from "../../src/app.js";
import { env } from "../../src/env.js";
import { createAuth } from "../../src/auth.js";
import type { DatabaseClient } from "../../src/db/client.js";
import { createTestAuthHarness } from "./test-auth.js";

export function createTestApp(
  db: DatabaseClient,
  options: { envOverrides?: Partial<typeof env> } = {},
) {
  const testEnv = {
    ...env,
    ...options.envOverrides,
  };
  const auth = createAuth({ db, env: testEnv });
  const authHarness = createTestAuthHarness();

  return createApp({
    auth,
    authRouteHandler: authHarness.authRouteHandler,
    db,
    env: testEnv,
    getSession: authHarness.getSession,
  });
}
