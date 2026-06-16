import "dotenv/config";

type TrustProxySetting = boolean | number;

const integerPattern = /^\d+$/;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  return value;
}

function parsePort(value: string): number {
  if (!integerPattern.test(value.trim())) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function parseTrustProxy(value: string | undefined): TrustProxySetting {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  if (!integerPattern.test(normalizedValue)) {
    throw new Error("TRUST_PROXY must be `true`, `false` or a non-negative integer.");
  }

  const hopCount = Number(normalizedValue);

  if (Number.isInteger(hopCount) && hopCount >= 0) {
    return hopCount;
  }

  throw new Error("TRUST_PROXY must be `true`, `false` or a non-negative integer.");
}

function parseUrl(name: string, value: string): string {
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

function parseOrigin(name: string, value: string): string {
  return new URL(parseUrl(name, value)).origin;
}

function readUrlEnv(name: string, defaultValue?: string): string {
  const value = optionalEnv(name);

  if (value) {
    return parseUrl(name, value);
  }

  if (defaultValue) {
    return parseUrl(name, defaultValue);
  }

  throw new Error(`${name} is required.`);
}

function listEnv(name: string): string[] {
  return (
    process.env[name]
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? []
  );
}

const nodeEnv = optionalEnv("NODE_ENV") ?? "development";
const isProduction = nodeEnv === "production";

// En production, ces URLs doivent être explicites pour éviter un démarrage
// silencieux avec des callbacks ou des origins incorrectes.
const frontendUrl = readUrlEnv(
  "FRONTEND_URL",
  isProduction ? undefined : "http://localhost:5173",
);
const betterAuthUrl = readUrlEnv(
  "BETTER_AUTH_URL",
  isProduction ? undefined : "http://localhost:3000",
);
const frontendOrigins = Array.from(
  new Set([
    new URL(frontendUrl).origin,
    ...listEnv("FRONTEND_ORIGINS").map((value, index) =>
      parseOrigin(`FRONTEND_ORIGINS[${index}]`, value),
    ),
  ]),
);

export const env = {
  nodeEnv,
  isProduction,
  port: parsePort(process.env.PORT ?? "3000"),
  trustProxy: parseTrustProxy(optionalEnv("TRUST_PROXY")),
  databaseUrl: parseUrl("DATABASE_URL", requireEnv("DATABASE_URL")),
  betterAuthSecret: requireEnv("BETTER_AUTH_SECRET"),
  betterAuthUrl,
  betterAuthOrigin: new URL(betterAuthUrl).origin,
  frontendUrl,
  frontendOrigins,
  githubClientId: optionalEnv("GITHUB_CLIENT_ID"),
  githubClientSecret: optionalEnv("GITHUB_CLIENT_SECRET"),
  googleClientId: optionalEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),
};
