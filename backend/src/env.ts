import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    return undefined;
  }

  return value;
}

function listEnv(name: string): string[] {
  return (
    process.env[name]
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? []
  );
}

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  betterAuthSecret: requireEnv("BETTER_AUTH_SECRET"),
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  frontendUrl,
  frontendOrigins: Array.from(
    new Set([frontendUrl, ...listEnv("FRONTEND_ORIGINS")]),
  ),
  githubClientId: optionalEnv("GITHUB_CLIENT_ID"),
  githubClientSecret: optionalEnv("GITHUB_CLIENT_SECRET"),
  googleClientId: optionalEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),
};
