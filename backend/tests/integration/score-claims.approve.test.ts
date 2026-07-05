import request from "supertest";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { resetRateLimitStoreForTests } from "../../src/app.js";
import { games, scoreClaimRequests, users } from "../../src/db/schema.js";
import { createTestApp } from "../helpers/create-test-app.js";
import { createPostgresTestDatabase } from "../helpers/postgres-test-db.js";

describe("score-claims integration - approve", () => {
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

  it("returns 401 when approval is requested without a session", async () => {
    // Ce test protège la contrainte d'authentification minimale du flux :
    // un score ne doit jamais être rattaché à un compte absent.
    const { claimCode } = await createClaimableScore();

    const response = await request(app)
      .post("/api/score-claims/approve")
      .send({ claimCode });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "authentication_required",
    });
  });

  it("returns 400 when the approval body has no claim code", async () => {
    const response = await request(app)
      .post("/api/score-claims/approve")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "claim_code_required",
    });
  });

  it("returns 400 for an invalid approval claim code", async () => {
    const response = await request(app)
      .post("/api/score-claims/approve")
      .send({
        claimCode: "not-a-valid-code",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "invalid_claim_code",
    });
  });

  it("approves a valid claim and attaches the game to the authenticated user", async () => {
    await createUser("player_approve_ok", "player_ok");
    const { claimCode, gameId } = await createClaimableScore(222222);

    const response = await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_approve_ok")
      .set("x-test-email", "player_approve_ok@example.test")
      .set("x-test-username", "player_ok")
      .send({ claimCode });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      approvedAt: expect.any(String),
      expiresAt: expect.any(String),
      game: {
        finalScore: 222222,
        id: gameId,
        playedAt: expect.any(String),
        playedDurationSeconds: 90,
      },
      status: "approved",
      user: {
        username: "player_ok",
      },
    });

    const [persistedGame] = await db
      .select({
        userId: games.userId,
      })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    const [persistedClaim] = await db
      .select({
        status: scoreClaimRequests.status,
        userId: scoreClaimRequests.userId,
      })
      .from(scoreClaimRequests)
      .where(eq(scoreClaimRequests.claimCode, claimCode))
      .limit(1);

    expect(persistedGame?.userId).toBe("player_approve_ok");
    expect(persistedClaim).toMatchObject({
      status: "approved",
      userId: "player_approve_ok",
    });
  });

  it("returns approved again when the claim is already approved", async () => {
    await createUser("player_approve_idempotent", "player_idempotent");
    const { claimCode, gameId } = await createClaimableScore(333333);

    await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_approve_idempotent")
      .set("x-test-email", "player_approve_idempotent@example.test")
      .set("x-test-username", "player_idempotent")
      .send({ claimCode });

    const secondResponse = await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_approve_idempotent")
      .set("x-test-email", "player_approve_idempotent@example.test")
      .set("x-test-username", "player_idempotent")
      .send({ claimCode });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toMatchObject({
      approvedAt: expect.any(String),
      expiresAt: expect.any(String),
      game: {
        finalScore: 333333,
        id: gameId,
        playedAt: expect.any(String),
        playedDurationSeconds: 90,
      },
      status: "approved",
      user: {
        username: "player_idempotent",
      },
    });
  });

  it("returns 404 for an unknown claim code", async () => {
    await createUser("player_approve_missing", "player_missing");

    const response = await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_approve_missing")
      .set("x-test-email", "player_approve_missing@example.test")
      .set("x-test-username", "player_missing")
      .send({
        claimCode: "ABCDEFGHIJKLMNOPQRSTUVWX12345678",
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "score_claim_not_found",
    });
  });

  it("returns 410 for an expired claim", async () => {
    await createUser("player_approve_expired", "player_expired");
    const { claimCode } = await createClaimableScore(444444);

    await db
      .update(scoreClaimRequests)
      .set({
        expiresAt: new Date(Date.now() - 60_000),
      })
      .where(eq(scoreClaimRequests.claimCode, claimCode));

    const response = await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_approve_expired")
      .set("x-test-email", "player_approve_expired@example.test")
      .set("x-test-username", "player_expired")
      .send({ claimCode });

    expect(response.status).toBe(410);
    expect(response.body).toEqual({
      error: "score_claim_expired",
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

  it("returns 409 when the claim game is already owned by another user", async () => {
    await createUser("player_original_owner", "original_owner");
    await createUser("player_conflict_requester", "conflict_requester");
    const { claimCode, gameId } = await createClaimableScore(555555);

    await db
      .update(games)
      .set({
        userId: "player_original_owner",
      })
      .where(eq(games.id, gameId));

    const response = await request(app)
      .post("/api/score-claims/approve")
      .set("x-test-user-id", "player_conflict_requester")
      .set("x-test-email", "player_conflict_requester@example.test")
      .set("x-test-username", "conflict_requester")
      .send({ claimCode });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: "score_claim_game_already_owned",
    });

    const [persistedClaim] = await db
      .select({
        status: scoreClaimRequests.status,
        userId: scoreClaimRequests.userId,
      })
      .from(scoreClaimRequests)
      .where(eq(scoreClaimRequests.claimCode, claimCode))
      .limit(1);

    expect(persistedClaim).toMatchObject({
      status: "pending",
      userId: null,
    });
  });
});
