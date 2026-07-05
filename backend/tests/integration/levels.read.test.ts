import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { resetRateLimitStoreForTests } from "../../src/app.js";
import { levels, users } from "../../src/db/schema.js";
import { createTestApp } from "../helpers/create-test-app.js";
import { createPostgresTestDatabase } from "../helpers/postgres-test-db.js";

describe("levels integration - read", () => {
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

  async function createUser(userId: string) {
    await db.insert(users).values({
      email: `${userId}@example.test`,
      id: userId,
      name: userId,
      username: userId,
    });
  }

  async function createLevel(id: string, ownerId: string | null) {
    await db.insert(levels).values({
      id,
      name: `Level ${id}`,
      userId: ownerId,
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  it("returns an empty array when there are no levels", async () => {
    const response = await request(app).get("/api/levels");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("computes isOwner per level and never exposes a raw userId", async () => {
    await createUser("owner_a");
    await createUser("owner_b");
    await createLevel("level_a", "owner_a");
    await createLevel("level_b", "owner_b");

    const asOwnerA = await request(app)
      .get("/api/levels")
      .set("x-test-user-id", "owner_a");

    expect(asOwnerA.status).toBe(200);
    const byId = Object.fromEntries(
      (asOwnerA.body as Array<{ id: string; isOwner: boolean }>).map((row) => [row.id, row]),
    );
    expect(byId.level_a.isOwner).toBe(true);
    expect(byId.level_b.isOwner).toBe(false);
    for (const row of asOwnerA.body) {
      expect(row).not.toHaveProperty("userId");
    }

    const anonymous = await request(app).get("/api/levels");
    expect(anonymous.status).toBe(200);
    for (const row of anonymous.body) {
      expect(row.isOwner).toBe(false);
      expect(row).not.toHaveProperty("userId");
    }
  });

  it("returns 404 for an unknown level id", async () => {
    const response = await request(app).get("/api/levels/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "level_not_found" });
  });

  it("returns full element detail with a correct isOwner flag", async () => {
    await createUser("detail_owner");
    await db.insert(levels).values({
      id: "level_detail",
      name: "Detail level",
      userId: "detail_owner",
      elements: [
        {
          id: "el-1",
          name: "Cylindre",
          type: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const asOwner = await request(app)
      .get("/api/levels/level_detail")
      .set("x-test-user-id", "detail_owner");

    expect(asOwner.status).toBe(200);
    expect(asOwner.body.isOwner).toBe(true);
    expect(asOwner.body.elements).toHaveLength(1);
    expect(asOwner.body).not.toHaveProperty("userId");

    const asStranger = await request(app)
      .get("/api/levels/level_detail")
      .set("x-test-user-id", "someone_else");

    expect(asStranger.status).toBe(200);
    expect(asStranger.body.isOwner).toBe(false);
  });

  it("keeps an unrecognized element type intact when reading (read tolerance)", async () => {
    // Simule une ligne écrite par une version future du Maker, avec un type
    // d'élément que le backend actuel ne connaît pas encore. La lecture ne
    // doit jamais rejeter ni tronquer ce contenu.
    await db.insert(levels).values({
      id: "level_future",
      name: "Future level",
      userId: null,
      elements: [
        {
          id: "el-future",
          name: "Rampe",
          type: "future-ramp",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).get("/api/levels/level_future");

    expect(response.status).toBe(200);
    expect(response.body.elements).toEqual([
      expect.objectContaining({ id: "el-future", type: "future-ramp" }),
    ]);
  });
});
