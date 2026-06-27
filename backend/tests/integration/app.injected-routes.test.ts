import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp, resetRateLimitStoreForTests } from "../../src/app.js";
import type { AuthInstance } from "../../src/auth.js";
import type { DatabaseClient } from "../../src/db/client.js";
import { env } from "../../src/env.js";
import type { RemoteScoreClaimStarter } from "../../src/services/remote-score-claim-client.js";

type AppSession = {
  session: {
    id: string;
    userId: string;
  };
  user: {
    email?: string | null;
    id: string;
    username?: string | null;
  };
};

function createRouteTestApp(
  options: {
    db?: Partial<DatabaseClient>;
    envOverrides?: Partial<typeof env>;
    getSession?: (headers: Record<string, unknown>) => Promise<AppSession | null>;
    remoteScoreClaimStarter?: RemoteScoreClaimStarter;
  } = {},
) {
  return createApp({
    auth: {} as AuthInstance,
    authRouteHandler: (_request, response) => {
      response.status(501).json({
        error: "auth_routes_disabled_in_injected_route_tests",
      });
    },
    db: {
      execute: async () => undefined,
      ...options.db,
    } as DatabaseClient,
    env: {
      ...env,
      ...options.envOverrides,
    },
    getSession:
      options.getSession ??
      (async () => null),
    remoteScoreClaimStarter:
      options.remoteScoreClaimStarter ??
      (async () => {
        throw new Error("remote score claim starter not configured in test");
      }),
  });
}

function createStatusSelectBuilder<T>(rows: T[]) {
  return {
    from: () => ({
      innerJoin: () => ({
        leftJoin: () => ({
          where: () => ({
            limit: async () => rows,
          }),
        }),
      }),
    }),
  };
}

describe("app injected routes", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
    vi.restoreAllMocks();
  });

  it("routes /api/auth requests through the injected auth handler", async () => {
    const response = await request(createRouteTestApp()).get("/api/auth/session");

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      error: "auth_routes_disabled_in_injected_route_tests",
    });
  });

  it("falls back to a generic 500 error for non-Error exceptions", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createRouteTestApp({
      db: {
        transaction: async () => {
          throw { unexpected: true };
        },
      },
      getSession: async () => ({
        session: {
          id: "session_internal_error",
          userId: "player_internal_error",
        },
        user: {
          email: "player_internal_error@example.test",
          id: "player_internal_error",
          username: "player_internal_error",
        },
      }),
    });

    const response = await request(app)
      .post("/api/score-claims/approve")
      .send({
        claimCode: "ABCDEFGHIJKLMNOPQRSTUVWX12345678",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "internal_server_error",
    });

    consoleError.mockRestore();
  });

  it("returns 500 with the standard handler when a route throws an Error instance", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createRouteTestApp({
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  limit: async () => {
                    throw new Error("read failure");
                  },
                }),
              }),
            }),
          }),
        }),
      },
    });

    const response = await request(app).get(
      "/api/score-claims/status/ABCDEFGHIJKLMNOPQRSTUVWX12345678",
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "internal_server_error",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Unhandled request error:",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });

  it("blocks score claim starts after the in-memory rate limit is exceeded", async () => {
    const app = createRouteTestApp({
      envOverrides: {
        trustProxy: true,
      },
    });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request(app)
        .post("/api/score-claims/start")
        .set("X-Forwarded-For", "203.0.113.10")
        .send({
          finalScore: 0,
          mode: "arcade",
          playedDurationSeconds: 90,
          requestClaim: true,
        });

      expect(response.status).toBe(200);
    }

    const limitedResponse = await request(app)
      .post("/api/score-claims/start")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({
        finalScore: 0,
        mode: "arcade",
        playedDurationSeconds: 90,
        requestClaim: true,
      });

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "too_many_score_claim_starts",
    });
  });

  it("relays score claim starts to the remote VPS when remote mode is enabled", async () => {
    const remoteScoreClaimStarter = vi.fn(async () => ({
      claim: {
        claimCode: "ABCDEFGHIJKLMNOPQRSTUVWX12345678",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        status: "pending" as const,
        verificationUrl: "https://scores.example.test/score-claim?code=ABCDEFGHIJKLMNOPQRSTUVWX12345678&mode=arcade",
      },
      decision: "save_and_claimable" as const,
      game: {
        finalScore: 654321,
        id: 91,
        playedAt: new Date().toISOString(),
        playedDurationSeconds: 95,
      },
      reason: "guest_claim_requested" as const,
    }));
    const app = createRouteTestApp({
      envOverrides: {
        borneToken: "cabinet-secret",
        globalApiUrl: "https://scores.example.test/",
        scoreClaimMode: "remote",
      },
      remoteScoreClaimStarter,
    });

    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 654321,
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.claim.verificationUrl).toBe(
      "https://scores.example.test/score-claim?code=ABCDEFGHIJKLMNOPQRSTUVWX12345678&mode=arcade",
    );
    expect(remoteScoreClaimStarter).toHaveBeenCalledWith({
      borneToken: "cabinet-secret",
      globalApiUrl: "https://scores.example.test/",
      payload: {
        finalScore: 654321,
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: true,
      },
    });
  });

  it("returns 503 instead of creating a broken QR when remote settings are incomplete", async () => {
    const app = createRouteTestApp({
      envOverrides: {
        borneToken: undefined,
        globalApiUrl: "https://scores.example.test/",
        scoreClaimMode: "remote",
      },
    });

    const response = await request(app)
      .post("/api/score-claims/start")
      .send({
        finalScore: 654321,
        mode: "arcade",
        playedDurationSeconds: 95,
        requestClaim: true,
      });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: "remote_score_claim_not_configured",
    });
  });

  it("blocks repeated status lookups for the same claim code after the route limit", async () => {
    const claimCode = "STATUSLOOKUPCODE1234567890ABCDEF";
    const app = createRouteTestApp({
      db: {
        select: () => createStatusSelectBuilder([]),
      },
      envOverrides: {
        trustProxy: true,
      },
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await request(app)
        .get(`/api/score-claims/status/${claimCode}`)
        .set("X-Forwarded-For", "203.0.113.20");

      expect(response.status).toBe(404);
    }

    const limitedResponse = await request(app)
      .get(`/api/score-claims/status/${claimCode}`)
      .set("X-Forwarded-For", "203.0.113.20");

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "too_many_score_claim_status_requests",
    });
  });

  it("blocks repeated status lookups from the same IP even across different claim codes", async () => {
    const app = createRouteTestApp({
      db: {
        select: () => createStatusSelectBuilder([]),
      },
      envOverrides: {
        trustProxy: true,
      },
    });

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const claimCode = `STATUSIP${String(attempt).padStart(24, "0")}`;
      const response = await request(app)
        .get(`/api/score-claims/status/${claimCode}`)
        .set("X-Forwarded-For", "203.0.113.21");

      expect(response.status).toBe(404);
    }

    const limitedResponse = await request(app)
      .get("/api/score-claims/status/STATUSIPLIMITOVERFLOW00000000000")
      .set("X-Forwarded-For", "203.0.113.21");

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "too_many_score_claim_status_requests",
    });
  });

  it("blocks repeated approval attempts from the same IP after the route limit", async () => {
    const claimCode = "APPROVERATELIMITCODE1234567890AB";
    const app = createRouteTestApp({
      envOverrides: {
        trustProxy: true,
      },
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app)
        .post("/api/score-claims/approve")
        .set("X-Forwarded-For", "203.0.113.30")
        .send({
          claimCode,
        });

      expect(response.status).toBe(401);
    }

    const limitedResponse = await request(app)
      .post("/api/score-claims/approve")
      .set("X-Forwarded-For", "203.0.113.30")
      .send({
        claimCode,
      });

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "too_many_score_claim_approve_requests",
    });
  });

  it("blocks repeated approval attempts from the same IP across different claim codes", async () => {
    const app = createRouteTestApp({
      envOverrides: {
        trustProxy: true,
      },
    });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const claimCode = `APPROVEIP${String(attempt).padStart(23, "0")}`;
      const response = await request(app)
        .post("/api/score-claims/approve")
        .set("X-Forwarded-For", "203.0.113.31")
        .send({
          claimCode,
        });

      expect(response.status).toBe(401);
    }

    const limitedResponse = await request(app)
      .post("/api/score-claims/approve")
      .set("X-Forwarded-For", "203.0.113.31")
      .send({
        claimCode: "APPROVEIPLIMITOVERFLOW0000000000",
      });

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "too_many_score_claim_approve_requests",
    });
  });
});
