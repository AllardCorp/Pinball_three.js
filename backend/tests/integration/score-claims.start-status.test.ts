import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestApp } from "../helpers/create-test-app.js";
import { createPostgresTestDatabase } from "../helpers/postgres-test-db.js";

describe("score-claims integration - start and status", () => {
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

  it("returns discard for a non-significant guest score", async () => {
    // Ce test protège le filtre métier principal : sans lui, on risquerait
    // d'enregistrer en base des fins de partie qui n'ont aucune valeur produit.
    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 0,
        mode: "arcade",
        playedDurationSeconds: 40,
        requestClaim: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      claim: null,
      decision: "discard",
      game: null,
      reason: "score_not_significant",
    });
  });

  it("creates a claimable score in arcade mode when the guest requests a claim", async () => {
    // On teste ce cas en intégration plutôt qu'en unitaire car on veut
    // vérifier à la fois la décision métier, l'écriture SQL et le contrat HTTP.
    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 123456,
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.decision).toBe("save_and_claimable");
    expect(response.body.game).toMatchObject({
      finalScore: 123456,
      playedDurationSeconds: 95,
    });
    expect(response.body.claim).toMatchObject({
      status: "pending",
    });
    expect(response.body.claim.claimCode).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(response.body.claim.verificationUrl).toContain("/score-claim?code=");
    expect(response.body.claim.verificationUrl).toContain("mode=arcade");
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: "not-a-number",
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: true,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "finalScore_invalid",
    });
  });

  it("returns pending for a valid claim code", async () => {
    const startResponse = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 654321,
        mode: "arcade",
        playedDurationSeconds: 120,
        requestClaim: true,
      });

    const claimCode = startResponse.body.claim.claimCode as string;

    const statusResponse = await request(app).get(`/api/score-claims/status/${claimCode}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe("pending");
    expect(statusResponse.body.game).toMatchObject({
      finalScore: 654321,
      playedDurationSeconds: 120,
    });
    expect(statusResponse.body.user).toBeNull();
  });

  it("returns 404 for an unknown claim code", async () => {
    const response = await request(app).get("/api/score-claims/status/ABCDEFGHIJKLMNOPQRSTUVWX12345678");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: "not_found",
    });
  });
});
