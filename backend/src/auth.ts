import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";

import { getDb, type DatabaseClient } from "./db/client.js";
import * as schema from "./db/schema.js";
import { env } from "./env.js";

type BetterAuthOptions = Parameters<typeof betterAuth>[0];
type AuthEnv = typeof env;

type CreateAuthDependencies = {
  db: DatabaseClient;
  env: AuthEnv;
};

function createSocialProviders(authEnv: AuthEnv) {
  // On garde un objet typé pour éviter un typage trop permissif
  // sur une zone sensible de la configuration d'authentification.
  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (authEnv.githubClientId && authEnv.githubClientSecret) {
    socialProviders.github = {
      clientId: authEnv.githubClientId,
      clientSecret: authEnv.githubClientSecret,
    };
  }

  if (authEnv.googleClientId && authEnv.googleClientSecret) {
    socialProviders.google = {
      clientId: authEnv.googleClientId,
      clientSecret: authEnv.googleClientSecret,
    };
  }

  return socialProviders;
}

const modelMapping = {
  user: "users" as const,
  session: "sessions" as const,
  account: "accounts" as const,
  verification: "verifications" as const,
};

export function createAuth({
  db,
  env,
}: CreateAuthDependencies) {
  return betterAuth({
    appName: "Pinball Three.js",
    baseURL: env.betterAuthUrl,
    secret: env.betterAuthSecret,

    trustedOrigins: Array.from(
      new Set([...env.frontendOrigins, env.betterAuthOrigin]),
    ),

    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),

    // Better Auth attend une correspondance exacte entre ses modèles
    // internes et nos tables Drizzle personnalisées.
    user: { modelName: modelMapping.user },
    session: {
      modelName: modelMapping.session,
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    account: {
      modelName: modelMapping.account,
      // Les tokens OAuth ne doivent jamais rester lisibles en base.
      encryptOAuthTokens: true,
    },
    verification: { modelName: modelMapping.verification },

    advanced: {
      useSecureCookies: env.isProduction,
    },

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },

    socialProviders: createSocialProviders(env),

    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
      }),
    ],

    onInit: () => {
      console.log("Better Auth initialisé avec succès");
    },
  });
}

let defaultAuth: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!defaultAuth) {
    defaultAuth = createAuth({ db: getDb(), env });
  }

  return defaultAuth;
}

export type AuthInstance = ReturnType<typeof createAuth>;
