import { afterEach, describe, expect, it, vi } from "vitest";

const envKeys = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "FRONTEND_ORIGINS",
  "FRONTEND_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NODE_ENV",
  "PORT",
  "TRUST_PROXY",
] as const;

type EnvKey = (typeof envKeys)[number];

const savedEnv = new Map<EnvKey, string | undefined>();

for (const key of envKeys) {
  savedEnv.set(key, process.env[key]);
}

afterEach(() => {
  for (const key of envKeys) {
    const value = savedEnv.get(key);

    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
});

async function importEnv(overrides: Partial<Record<EnvKey, string>>) {
  for (const key of envKeys) {
    process.env[key] = "";
  }

  Object.assign(process.env, overrides);
  vi.resetModules();

  return import("../../src/env.js");
}

function validEnv(overrides: Partial<Record<EnvKey, string>> = {}) {
  return {
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:3000",
    DATABASE_URL: "postgres://user:password@localhost:5432/pinball",
    FRONTEND_URL: "http://localhost:5173",
    NODE_ENV: "test",
    PORT: "3000",
    ...overrides,
  };
}

describe("env", () => {
  it("requires explicit URLs in production", async () => {
    await expect(
      importEnv(
        validEnv({
          FRONTEND_URL: "",
          NODE_ENV: "production",
        }),
      ),
    ).rejects.toThrow("FRONTEND_URL is required.");
  });

  it("requires the auth secret in production", async () => {
    await expect(
      importEnv(
        validEnv({
          BETTER_AUTH_SECRET: "",
          NODE_ENV: "production",
        }),
      ),
    ).rejects.toThrow("BETTER_AUTH_SECRET is required.");
  });

  it("rejects invalid absolute URLs", async () => {
    await expect(
      importEnv(
        validEnv({
          DATABASE_URL: "not-a-url",
        }),
      ),
    ).rejects.toThrow("DATABASE_URL must be a valid absolute URL.");
  });

  it("normalizes multiple frontend origins and removes duplicates", async () => {
    const { env } = await importEnv(
      validEnv({
        FRONTEND_ORIGINS: "https://arcade.example.test/play, https://admin.example.test, https://arcade.example.test",
        FRONTEND_URL: "https://app.example.test/path",
      }),
    );

    expect(env.frontendOrigins).toEqual([
      "https://app.example.test",
      "https://arcade.example.test",
      "https://admin.example.test",
    ]);
  });

  it.each([
    ["true", true],
    ["false", false],
    ["2", 2],
  ])("parses TRUST_PROXY=%s", async (trustProxy, expectedValue) => {
    const { env } = await importEnv(validEnv({ TRUST_PROXY: trustProxy }));

    expect(env.trustProxy).toBe(expectedValue);
  });

  it("defaults TRUST_PROXY to false", async () => {
    const { env } = await importEnv(validEnv());

    expect(env.trustProxy).toBe(false);
  });

  it.each(["abc", "1.5", "1proxy", "-1"])(
    "rejects invalid TRUST_PROXY=%s",
    async (trustProxy) => {
      await expect(importEnv(validEnv({ TRUST_PROXY: trustProxy }))).rejects.toThrow(
        "TRUST_PROXY must be `true`, `false` or a non-negative integer.",
      );
    },
  );

  it.each(["0", "65536", "3000abc", "3000.5"])(
    "rejects invalid PORT=%s",
    async (port) => {
      await expect(importEnv(validEnv({ PORT: port }))).rejects.toThrow(
        "PORT must be an integer between 1 and 65535.",
      );
    },
  );
});
