import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: unknown) => ({
    api: {},
    options,
  })),
  db: { kind: "default-db" },
  drizzleAdapter: vi.fn(() => ({ kind: "drizzle-adapter" })),
  env: {
    betterAuthOrigin: "https://auth.default.test",
    betterAuthSecret: "default-secret",
    betterAuthUrl: "https://auth.default.test",
    frontendOrigins: ["https://app.default.test"],
    githubClientId: undefined,
    githubClientSecret: undefined,
    googleClientId: undefined,
    googleClientSecret: undefined,
    isProduction: false,
  },
  username: vi.fn((options: unknown) => ({
    kind: "username-plugin",
    options,
  })),
}));

vi.mock("better-auth", () => ({
  betterAuth: mocks.betterAuth,
}));

vi.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: mocks.drizzleAdapter,
}));

vi.mock("better-auth/plugins", () => ({
  username: mocks.username,
}));

vi.mock("../../src/db/client.js", () => ({
  getDb: vi.fn(() => mocks.db),
}));

vi.mock("../../src/env.js", () => ({
  env: mocks.env,
}));

import { createAuth } from "../../src/auth.js";

function buildAuthEnv(
  overrides: Partial<{
    betterAuthOrigin: string;
    betterAuthSecret: string;
    betterAuthUrl: string;
    frontendOrigins: string[];
    githubClientId: string | undefined;
    githubClientSecret: string | undefined;
    googleClientId: string | undefined;
    googleClientSecret: string | undefined;
    isProduction: boolean;
  }> = {},
) {
  return {
    betterAuthOrigin: "https://auth.example.test",
    betterAuthSecret: "test-secret",
    betterAuthUrl: "https://auth.example.test",
    frontendOrigins: ["https://app.example.test"],
    githubClientId: undefined,
    githubClientSecret: undefined,
    googleClientId: undefined,
    googleClientSecret: undefined,
    isProduction: false,
    ...overrides,
  };
}

describe("auth configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes only social providers with complete credentials", () => {
    createAuth({
      db: { kind: "test-db" } as never,
      env: buildAuthEnv({
        githubClientId: "github-client-id",
        githubClientSecret: "github-client-secret",
        googleClientId: "google-client-id",
        googleClientSecret: "google-client-secret",
      }) as never,
    });

    const options = mocks.betterAuth.mock.calls.at(-1)?.[0] as {
      socialProviders: Record<string, unknown>;
    };

    expect(options.socialProviders).toEqual({
      github: {
        clientId: "github-client-id",
        clientSecret: "github-client-secret",
      },
      google: {
        clientId: "google-client-id",
        clientSecret: "google-client-secret",
      },
    });
  });

  it("deduplicates trusted origins and enables secure cookies in production", () => {
    createAuth({
      db: { kind: "test-db" } as never,
      env: buildAuthEnv({
        betterAuthOrigin: "https://app.example.test",
        frontendOrigins: [
          "https://app.example.test",
          "https://arcade.example.test",
          "https://app.example.test",
        ],
        isProduction: true,
      }) as never,
    });

    const options = mocks.betterAuth.mock.calls.at(-1)?.[0] as {
      advanced: {
        useSecureCookies: boolean;
      };
      trustedOrigins: string[];
    };

    expect(options.trustedOrigins).toEqual([
      "https://app.example.test",
      "https://arcade.example.test",
    ]);
    expect(options.advanced.useSecureCookies).toBe(true);
  });

  it("wires the username plugin with the expected username bounds", () => {
    createAuth({
      db: { kind: "test-db" } as never,
      env: buildAuthEnv() as never,
    });

    expect(mocks.username).toHaveBeenCalledWith({
      maxUsernameLength: 30,
      minUsernameLength: 3,
    });
  });

  it("logs a success message when Better Auth initialization completes", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    createAuth({
      db: { kind: "test-db" } as never,
      env: buildAuthEnv() as never,
    });

    const options = mocks.betterAuth.mock.calls.at(-1)?.[0] as {
      onInit: () => void;
    };

    options.onInit();

    expect(consoleLog).toHaveBeenCalledWith("Better Auth initialisé avec succès");
    consoleLog.mockRestore();
  });
});
