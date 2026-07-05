import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp, resetRateLimitStoreForTests } from "../../src/app.js";
import type { AuthInstance } from "../../src/auth.js";
import type { DatabaseClient } from "../../src/db/client.js";
import { env } from "../../src/env.js";

function createInjectedApp(
  options: {
    db?: Partial<DatabaseClient>;
    envOverrides?: Partial<typeof env>;
    execute?: () => Promise<unknown>;
    getSession?: () => Promise<unknown>;
    session?: unknown;
  } = {},
) {
  return createApp({
    auth: {} as AuthInstance,
    authRouteHandler: (_request, response) => {
      response.status(501).json({
        error: "auth_routes_disabled_in_system_route_tests",
      });
    },
    db: {
      execute: options.execute ?? (async () => undefined),
      ...options.db,
    } as unknown as DatabaseClient,
    env: {
      ...env,
      ...options.envOverrides,
    },
    getSession: options.getSession ?? (async () => options.session as never),
  });
}

describe("system route behavior", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
    vi.restoreAllMocks();
  });

  it("returns 500 on /health when the database check fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingApp = createInjectedApp({
      execute: async () => {
        throw new Error("database unavailable");
      },
    });

    const response = await request(failingApp).get("/health");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      database: "disconnected",
      status: "error",
    });
    consoleError.mockRestore();
  });

  it("returns 401 on /api/me when no session is present", async () => {
    const response = await request(createInjectedApp()).get("/api/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      authenticated: false,
    });
  });

  it("returns 500 on /api/me when session lookup fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(
      createInjectedApp({
        getSession: async () => {
          throw new Error("session store unavailable");
        },
      }),
    ).get("/api/me");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      authenticated: false,
      error: "session_lookup_failed",
    });
    consoleError.mockRestore();
  });

  it("returns the session on /api/me when a test session is present", async () => {
    const response = await request(
      createInjectedApp({
        session: {
          session: {
            id: "session_player_me",
            userId: "player_me",
          },
          user: {
            email: "player_me@example.test",
            id: "player_me",
            username: "player_me_username",
          },
        },
      }),
    ).get("/api/me");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authenticated: true,
      session: {
        session: {
          id: "session_player_me",
          userId: "player_me",
        },
        user: {
          email: "player_me@example.test",
          id: "player_me",
          username: "player_me_username",
        },
      },
    });
  });

  it("returns 400 when the JSON body is malformed", async () => {
    const response = await request(createInjectedApp())
      .post("/api/score-claims/start")
      .set("content-type", "application/json")
      .send('{"finalScore":1234,');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "invalid_json_body",
    });
  });

  it("allows a configured frontend origin through CORS", async () => {
    const response = await request(createInjectedApp())
      .get("/health")
      .set("origin", env.frontendOrigins[0] ?? "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      env.frontendOrigins[0] ?? "http://localhost:5173",
    );
  });

  it("rejects a non-whitelisted CORS origin", async () => {
    const response = await request(createInjectedApp())
      .get("/health")
      .set("origin", "https://malicious.example.test");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "cors_origin_not_allowed",
    });
  });

  it("returns leaderboard entries correctly mapped and formatted", async () => {
    const mockGames = [
      { finalScore: 10000, username: "player1", displayUsername: "Player One" },
      { finalScore: 5000, username: "player2", displayUsername: null },
      { finalScore: 2000, username: null, displayUsername: null },
    ];

    const limitMock = vi.fn().mockResolvedValue(mockGames);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const leftJoinMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ leftJoin: leftJoinMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });

    const app = createInjectedApp({
      db: {
        select: selectMock,
      } as any,
    });

    const response = await request(app).get("/api/leaderboard");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      entries: [
        {
          rank: 1,
          score: 10000,
          name: "Player One",
          username: "player1",
          displayUsername: "Player One",
        },
        {
          rank: 2,
          score: 5000,
          name: "player2",
          username: "player2",
          displayUsername: "player2",
        },
        {
          rank: 3,
          score: 2000,
          name: "Anonyme",
          username: null,
          displayUsername: "Anonyme",
        },
      ],
    });
  });
});
