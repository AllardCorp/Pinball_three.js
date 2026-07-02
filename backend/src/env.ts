import "dotenv/config";

type TrustProxySetting = boolean | number;
type ScoreClaimMode = "local" | "remote";

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

function isUnsignedIntegerText(value: string): boolean {
  if (!value) {
    return false;
  }

  // Validation volontairement explicite plutôt qu'une regex : c'est plus
  // simple à justifier en soutenance et cela évite les cas ambigus.
  return [...value].every((character) => character >= "0" && character <= "9");
}

function parsePort(value: string): number {
  if (!isUnsignedIntegerText(value.trim())) {
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

  if (!isUnsignedIntegerText(normalizedValue)) {
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

function readOptionalUrlEnv(name: string): string | undefined {
  const value = optionalEnv(name);

  if (!value) {
    return undefined;
  }

  return parseUrl(name, value);
}

function listEnv(name: string): string[] {
  return (
    process.env[name]
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? []
  );
}

function parseScoreClaimMode(value: string | undefined): ScoreClaimMode {
  if (!value) {
    return "local";
  }

  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "local" || normalizedValue === "remote") {
    return normalizedValue;
  }

  throw new Error("SCORE_CLAIM_MODE must be `local` or `remote`.");
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
const scoreClaimMode = parseScoreClaimMode(optionalEnv("SCORE_CLAIM_MODE"));
const globalApiUrl = readOptionalUrlEnv("GLOBAL_API_URL");
const borneToken = optionalEnv("BORNE_TOKEN");

// En mode remote, le backend local de la borne ne doit jamais accepter de
// démarrer avec une configuration incomplète : sinon le QR code serait absent
// ou pointerait vers une cible inutilisable après une vraie partie.
if (scoreClaimMode === "remote" && !globalApiUrl) {
  throw new Error("GLOBAL_API_URL is required when SCORE_CLAIM_MODE=remote.");
}

if (scoreClaimMode === "remote" && !borneToken) {
  throw new Error("BORNE_TOKEN is required when SCORE_CLAIM_MODE=remote.");
}

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
  scoreClaimMode,
  globalApiUrl,
  borneToken,
  githubClientId: optionalEnv("GITHUB_CLIENT_ID"),
  githubClientSecret: optionalEnv("GITHUB_CLIENT_SECRET"),
  googleClientId: optionalEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),
};
