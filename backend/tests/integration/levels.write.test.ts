import request from "supertest";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { resetRateLimitStoreForTests } from "../../src/app.js";
import { levels, users } from "../../src/db/schema.js";
import { createTestApp } from "../helpers/create-test-app.js";
import { createPostgresTestDatabase } from "../helpers/postgres-test-db.js";

describe("levels integration - write", () => {
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

  function validElement(overrides: Record<string, unknown> = {}) {
    return {
      id: "el-1",
      name: "Cylindre",
      type: "cylinder",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      ...overrides,
    };
  }

  describe("POST /api/levels", () => {
    it("returns 401 without a session", async () => {
      const response = await request(app)
        .post("/api/levels")
        .send({ name: "My level", elements: [] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "authentication_required" });
    });

    it("creates a level and persists the owner's userId (never echoed back)", async () => {
      await createUser("creator_1");

      const response = await request(app)
        .post("/api/levels")
        .set("x-test-user-id", "creator_1")
        .send({ name: "My level", elements: [validElement()] });

      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty("userId");
      expect(response.body).not.toHaveProperty("elements");
      expect(response.body.isOwner).toBe(true);

      const [persisted] = await db
        .select({ userId: levels.userId, elements: levels.elements })
        .from(levels)
        .where(eq(levels.id, response.body.id))
        .limit(1);

      expect(persisted?.userId).toBe("creator_1");
      expect(persisted?.elements).toHaveLength(1);
    });

    it("returns 400 when an element has an unrecognized type", async () => {
      await createUser("creator_2");

      const response = await request(app)
        .post("/api/levels")
        .set("x-test-user-id", "creator_2")
        .send({ name: "My level", elements: [validElement({ type: "ramp" })] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "level_elements_invalid" });
    });

    it("returns 400 when the name is blank", async () => {
      await createUser("creator_3");

      const response = await request(app)
        .post("/api/levels")
        .set("x-test-user-id", "creator_3")
        .send({ name: "   ", elements: [] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "level_name_required" });
    });
  });

  describe("PUT /api/levels/:id", () => {
    async function createLevel(id: string, ownerId: string) {
      await db.insert(levels).values({
        id,
        name: "Original name",
        userId: ownerId,
        elements: [validElement()],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("returns 401 without a session", async () => {
      await createUser("owner_put_1");
      await createLevel("level_put_1", "owner_put_1");

      const response = await request(app)
        .put("/api/levels/level_put_1")
        .send({ name: "Updated", elements: [] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "authentication_required" });
    });

    it("returns 403 when a different authenticated user tries to update", async () => {
      await createUser("owner_put_2");
      await createUser("stranger_put_2");
      await createLevel("level_put_2", "owner_put_2");

      const response = await request(app)
        .put("/api/levels/level_put_2")
        .set("x-test-user-id", "stranger_put_2")
        .send({ name: "Updated", elements: [] });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: "level_forbidden" });
    });

    it("returns 404 when the level does not exist", async () => {
      await createUser("owner_put_3");

      const response = await request(app)
        .put("/api/levels/does-not-exist")
        .set("x-test-user-id", "owner_put_3")
        .send({ name: "Updated", elements: [] });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "level_not_found" });
    });

    it("updates name and elements when the owner requests it", async () => {
      await createUser("owner_put_4");
      await createLevel("level_put_4", "owner_put_4");

      const response = await request(app)
        .put("/api/levels/level_put_4")
        .set("x-test-user-id", "owner_put_4")
        .send({ name: "Updated name", elements: [validElement({ id: "el-2" })] });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated name");

      const [persisted] = await db
        .select({ name: levels.name, elements: levels.elements })
        .from(levels)
        .where(eq(levels.id, "level_put_4"))
        .limit(1);

      expect(persisted?.name).toBe("Updated name");
      expect(persisted?.elements).toEqual([expect.objectContaining({ id: "el-2" })]);
    });

    it("rejects re-saving a level containing an element type unknown to the current schema", async () => {
      // Simule un client resté ouvert sur un niveau écrit par une version
      // future du Maker : la lecture tolère ce type inconnu (voir
      // levels.read.test.ts), mais la sauvegarder telle quelle doit être
      // refusée — asymétrie lecture/écriture assumée.
      await createUser("owner_put_5");
      await db.insert(levels).values({
        id: "level_put_5",
        name: "Future level",
        userId: "owner_put_5",
        elements: [validElement({ id: "el-future", type: "future-ramp" })],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const getResponse = await request(app).get("/api/levels/level_put_5");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.elements).toEqual([
        expect.objectContaining({ type: "future-ramp" }),
      ]);

      const putResponse = await request(app)
        .put("/api/levels/level_put_5")
        .set("x-test-user-id", "owner_put_5")
        .send({ name: "Future level", elements: getResponse.body.elements });

      expect(putResponse.status).toBe(400);
      expect(putResponse.body).toEqual({ error: "level_elements_invalid" });
    });
  });

  describe("DELETE /api/levels/:id", () => {
    async function createLevel(id: string, ownerId: string) {
      await db.insert(levels).values({
        id,
        name: "To delete",
        userId: ownerId,
        elements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("returns 401 without a session", async () => {
      await createUser("owner_delete_1");
      await createLevel("level_delete_1", "owner_delete_1");

      const response = await request(app).delete("/api/levels/level_delete_1");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "authentication_required" });
    });

    it("returns 403 when a different authenticated user tries to delete", async () => {
      await createUser("owner_delete_2");
      await createUser("stranger_delete_2");
      await createLevel("level_delete_2", "owner_delete_2");

      const response = await request(app)
        .delete("/api/levels/level_delete_2")
        .set("x-test-user-id", "stranger_delete_2");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: "level_forbidden" });

      const [stillThere] = await db
        .select({ id: levels.id })
        .from(levels)
        .where(eq(levels.id, "level_delete_2"))
        .limit(1);
      expect(stillThere).toBeDefined();
    });

    it("returns 404 when the level does not exist", async () => {
      await createUser("owner_delete_3");

      const response = await request(app)
        .delete("/api/levels/does-not-exist")
        .set("x-test-user-id", "owner_delete_3");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "level_not_found" });
    });

    it("deletes the level when the owner requests it", async () => {
      await createUser("owner_delete_4");
      await createLevel("level_delete_4", "owner_delete_4");

      const response = await request(app)
        .delete("/api/levels/level_delete_4")
        .set("x-test-user-id", "owner_delete_4");

      expect(response.status).toBe(204);

      const [stillThere] = await db
        .select({ id: levels.id })
        .from(levels)
        .where(eq(levels.id, "level_delete_4"))
        .limit(1);
      expect(stillThere).toBeUndefined();
    });
  });
});
