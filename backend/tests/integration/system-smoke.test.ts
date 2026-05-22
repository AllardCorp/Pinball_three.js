import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestApp } from "../helpers/create-test-app.js";
import { createPostgresTestDatabase } from "../helpers/postgres-test-db.js";

// Test smoke pour vérifier que la base de données peut se connecter et parler avec le back-end
describe("system smoke", () => {
  let app: ReturnType<typeof createTestApp>;
  let teardown: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    const testDatabase = await createPostgresTestDatabase();

    app = createTestApp(testDatabase.db);
    teardown = testDatabase.teardown;
  });

  afterAll(async () => {
    await teardown?.();
  });

  it("returns 200 on /health when the database is reachable", async () => {
    // Ce smoke test protège l'hypothèse la plus simple du backend :
    // l'API doit au moins pouvoir démarrer et parler à la base.
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      database: "connected",
      status: "ok",
    });
  });

  it("returns 401 on /api/me when no session is present", async () => {
    const response = await request(app).get("/api/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      authenticated: false,
    });
  });
});
