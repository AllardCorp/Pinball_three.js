import request from "supertest";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { resetRateLimitStoreForTests } from "../../src/app.js";
import { games, scoreClaimRequests, users } from "../../src/db/schema.js";
import { createTestApp } from "../helpers/create-test-app.js";
import { createPostgresTestDatabase } from "../helpers/postgres-test-db.js";

describe("score-claims integration - start and status", () => {
  let app: ReturnType<typeof createTestApp>;
  let db: Awaited<ReturnType<typeof createPostgresTestDatabase>>["db"];
  let reset: (() => Promise<void>) | null = null;
  let teardown: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    const testDatabase = await createPostgresTestDatabase();

    app = createTestApp(testDatabase.db);
    db = testDatabase.db;
    reset = testDatabase.reset;
    teardown = testDatabase.teardown;
  });

  beforeEach(async () => {
    resetRateLimitStoreForTests();
    await reset?.();
  });

  afterAll(async () => {
    await teardown?.();
  });

  async function createUser(userId: string, username: string) {
    await db.insert(users).values({
      email: `${userId}@example.test`,
      id: userId,
      name: username,
      username,
    });
  }

  async function createClaimableScore(finalScore = 123456) {
    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore,
        mode: "arcade",
        playedDurationSeconds: 90,
        requestClaim: true,
      });

    return {
      claimCode: response.body.claim.claimCode as string,
      gameId: response.body.game.id as number,
    };
  }

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

  it.each([
    ["float number", { finalScore: 12.5, mode: "arcade", playedDurationSeconds: 95, requestClaim: true }, "finalScore_invalid"],
    ["partial string", { finalScore: "123abc", mode: "arcade", playedDurationSeconds: 95, requestClaim: true }, "finalScore_invalid"],
    ["float string", { finalScore: "123.5", mode: "arcade", playedDurationSeconds: 95, requestClaim: true }, "finalScore_invalid"],
    ["negative finalScore", { finalScore: -1, mode: "arcade", playedDurationSeconds: 95, requestClaim: true }, "finalScore_out_of_range"],
    ["postgres integer overflow", { finalScore: 2_147_483_648, mode: "arcade", playedDurationSeconds: 95, requestClaim: true }, "finalScore_out_of_range"],
    ["played duration string", { finalScore: 123456, mode: "arcade", playedDurationSeconds: "95sec", requestClaim: true }, "playedDurationSeconds_invalid"],
    ["played duration negative", { finalScore: 123456, mode: "arcade", playedDurationSeconds: -1, requestClaim: true }, "playedDurationSeconds_out_of_range"],
    ["invalid requestClaim flag", { finalScore: 123456, mode: "arcade", playedDurationSeconds: 95, requestClaim: "yes" }, "invalid_boolean_flag"],
  ])("returns 400 for an invalid start payload: %s", async (_caseName, payload, error) => {
    const response = await request(app)
      .post("/api/score-claims/start")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error });
  });

  it("saves an authenticated score without creating a claim", async () => {
    await createUser("player_start_authenticated", "player_start");

    const response = await request(app)
      .post("/api/score-claims/start")
      .set("x-test-user-id", "player_start_authenticated")
      .set("x-test-email", "player_start_authenticated@example.test")
      .set("x-test-username", "player_start")
      .send({
        finalScore: 777777,
        mode: "web",
        playedDurationSeconds: 95,
        requestClaim: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      claim: null,
      decision: "save",
      reason: "authenticated_user",
    });
    expect(response.body.game).toMatchObject({
      finalScore: 777777,
      playedDurationSeconds: 95,
    });
  });

  it("saves a web guest claim request without issuing a claim", async () => {
    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 888888,
        mode: "web",
        playedDurationSeconds: 95,
        requestClaim: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      claim: null,
      decision: "save",
      reason: "non_arcade_claim_request",
    });
  });

  it("saves a significant guest score for the leaderboard when fewer than 100 games exist", async () => {
    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 456789,
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: false,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      claim: null,
      decision: "save",
      reason: "guest_score_saved_for_leaderboard",
      game: {
        finalScore: 456789,
        playedDurationSeconds: 95,
      },
    });
  });

  it("discards a significant guest score that stays below a full leaderboard cutoff", async () => {
    await db.insert(games).values(
      Array.from({ length: 100 }, (_, index) => ({
        finalScore: 100_000 - index,
        playedAt: new Date(Date.now() - index * 1_000),
        playedDurationSeconds: 120,
        userId: null,
      })),
    );

    const gameCountBefore = (await db.select({ id: games.id }).from(games)).length;

    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 12_345,
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: false,
      });

    const gameCountAfter = (await db.select({ id: games.id }).from(games)).length;

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      claim: null,
      decision: "discard",
      game: null,
      reason: "guest_score_below_leaderboard_cutoff",
    });
    expect(gameCountAfter).toBe(gameCountBefore);
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

  it("returns approved with only the public username for a claimed score", async () => {
    await createUser("player_status_public_only", "public_only_player");
    const { claimCode } = await createClaimableScore(765432);

    await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_status_public_only")
      .set("x-test-email", "player_status_public_only@example.test")
      .set("x-test-username", "public_only_player")
      .send({ claimCode });

    const response = await request(app).get(`/api/score-claims/status/${claimCode}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("approved");
    expect(response.body.user).toEqual({
      username: "public_only_player",
    });
    expect(response.body.user).not.toHaveProperty("email");
    expect(response.body.user).not.toHaveProperty("id");
    expect(response.body.user).not.toHaveProperty("name");
  });

  it("returns 400 for an invalid status claim code", async () => {
    const response = await request(app).get("/api/score-claims/status/not-a-valid-code");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "invalid_claim_code",
    });
  });

  it("persists expiration when a pending claim is read after its TTL", async () => {
    const startResponse = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 765432,
        mode: "arcade",
        playedDurationSeconds: 120,
        requestClaim: true,
      });

    const claimCode = startResponse.body.claim.claimCode as string;

    await db
      .update(scoreClaimRequests)
      .set({
        expiresAt: new Date(Date.now() - 60_000),
      })
      .where(eq(scoreClaimRequests.claimCode, claimCode));

    const statusResponse = await request(app).get(`/api/score-claims/status/${claimCode}`);

    expect(statusResponse.status).toBe(410);
    expect(statusResponse.body).toEqual({
      status: "expired",
    });

    const [persistedClaim] = await db
      .select({
        status: scoreClaimRequests.status,
      })
      .from(scoreClaimRequests)
      .where(eq(scoreClaimRequests.claimCode, claimCode))
      .limit(1);

    expect(persistedClaim?.status).toBe("expired");
  });

  it("returns the approved owner and approval timestamp for an approved claim status", async () => {
    await createUser("player_status_approved", "approved_player");
    const { claimCode, gameId } = await createClaimableScore(876543);

    const approvalResponse = await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_status_approved")
      .set("x-test-email", "player_status_approved@example.test")
      .set("x-test-username", "approved_player")
      .send({ claimCode });

    expect(approvalResponse.status).toBe(200);

    const statusResponse = await request(app).get(`/api/score-claims/status/${claimCode}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toMatchObject({
      approvedAt: expect.any(String),
      game: {
        finalScore: 876543,
        id: gameId,
        playedDurationSeconds: 90,
      },
      status: "approved",
      user: {
        username: "approved_player",
      },
    });
  });
});
