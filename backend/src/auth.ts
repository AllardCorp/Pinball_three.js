import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { getDb, type DatabaseClient } from "./db/client.js";
import * as schema from "./db/schema.js";
import { env } from "./env.js";

type BetterAuthOptions = Parameters<typeof betterAuth>[0];
type AuthEnv = typeof env;

type CreateAuthDependencies = {
  db: DatabaseClient;
  env: AuthEnv;
};

type AuthUserCreationData = {
  displayUsername?: string | null;
  email?: string;
  name?: string | null;
  username?: string | null;
} & Record<string, unknown>;

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const DEFAULT_USERNAME_BASE = "joueur";

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function removeDiacritics(value: string) {
  return Array.from(value.normalize("NFD"))
    .filter((character) => character < "\u0300" || character > "\u036f")
    .join("");
}

function isUsernameLetterOrDigit(character: string) {
  const code = character.charCodeAt(0);
  const isDigit = code >= 48 && code <= 57;
  const isLowercaseLetter = code >= 97 && code <= 122;

  return isDigit || isLowercaseLetter;
}

function trimUsernameSeparators(value: string) {
  let startIndex = 0;
  let endIndex = value.length;

  while (startIndex < endIndex && isUsernameSeparator(value[startIndex] ?? "")) {
    startIndex += 1;
  }

  while (endIndex > startIndex && isUsernameSeparator(value[endIndex - 1] ?? "")) {
    endIndex -= 1;
  }

  return value.slice(startIndex, endIndex);
}

function isUsernameSeparator(character: string) {
  return character === "-" || character === "_";
}

function cropUsername(value: string) {
  return trimUsernameSeparators(value.slice(0, USERNAME_MAX_LENGTH));
}

export function normalizeUsernameCandidate(value: string) {
  const normalizedValue = removeDiacritics(value).toLowerCase();
  let nextUsername = "";
  let previousWasSeparator = false;

  for (const character of normalizedValue) {
    if (isUsernameLetterOrDigit(character)) {
      nextUsername += character;
      previousWasSeparator = false;
      continue;
    }

    if (!previousWasSeparator && nextUsername.length > 0) {
      nextUsername += "-";
      previousWasSeparator = true;
    }
  }

  const croppedUsername = cropUsername(nextUsername);

  if (croppedUsername.length >= USERNAME_MIN_LENGTH) {
    return croppedUsername;
  }

  return DEFAULT_USERNAME_BASE;
}

function getEmailLocalPart(email: string | null) {
  if (!email) {
    return null;
  }

  const atIndex = email.indexOf("@");
  return atIndex > 0 ? email.slice(0, atIndex) : email;
}

export function createUsernameBaseFromUser(user: AuthUserCreationData) {
  const preferredValue =
    getNonEmptyString(user.username) ??
    getNonEmptyString(user.displayUsername) ??
    getNonEmptyString(user.name) ??
    getEmailLocalPart(getNonEmptyString(user.email)) ??
    DEFAULT_USERNAME_BASE;

  return normalizeUsernameCandidate(preferredValue);
}

function createUsernameCandidate(baseUsername: string, suffix: number) {
  if (suffix === 0) {
    return cropUsername(baseUsername);
  }

  const suffixText = `-${suffix}`;
  const baseMaxLength = USERNAME_MAX_LENGTH - suffixText.length;
  return `${cropUsername(baseUsername.slice(0, baseMaxLength))}${suffixText}`;
}

async function isUsernameAvailable(db: DatabaseClient, usernameCandidate: string) {
  const existingUsers = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, usernameCandidate))
    .limit(1);

  return existingUsers.length === 0;
}

async function createAvailableUsername(db: DatabaseClient, baseUsername: string) {
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const usernameCandidate = createUsernameCandidate(baseUsername, suffix);

    if (await isUsernameAvailable(db, usernameCandidate)) {
      return usernameCandidate;
    }
  }

  // Cas très improbable : trop de collisions sur le même nom. On garde un
  // suffixe temporel lisible au lieu de bloquer complètement l'inscription.
  return createUsernameCandidate(baseUsername, Date.now());
}

async function createNormalizedUserData(db: DatabaseClient, user: AuthUserCreationData) {
  const currentUsername = getNonEmptyString(user.username);
  const currentDisplayUsername = getNonEmptyString(user.displayUsername);
  const currentName = getNonEmptyString(user.name);

  if (currentUsername && currentDisplayUsername && currentName) {
    return undefined;
  }

  const usernameValue = currentUsername
    ? normalizeUsernameCandidate(currentUsername)
    : await createAvailableUsername(db, createUsernameBaseFromUser(user));
  const shouldInitializeOAuthIdentity = !currentUsername;

  return {
    data: {
      ...user,
      // Pour les comptes OAuth, Better Auth peut créer un utilisateur sans
      // username. On initialise les champs visibles avec la même valeur simple
      // afin que le dashboard et le score claim restent exploitables.
      displayUsername: shouldInitializeOAuthIdentity
        ? usernameValue
        : currentDisplayUsername ?? usernameValue,
      name: shouldInitializeOAuthIdentity ? usernameValue : currentName ?? usernameValue,
      username: usernameValue,
    },
  };
}

function createSocialProviders(authEnv: AuthEnv) {
  // On garde un objet typé pour éviter un typage trop permissif
  // sur une zone sensible de la configuration d'authentification.
  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (authEnv.githubClientId && authEnv.githubClientSecret) {
    socialProviders.github = {
      clientId: authEnv.githubClientId,
      clientSecret: authEnv.githubClientSecret,
      // Better Auth demande déjà `read:user` et `user:email`, puis lit
      // `/user/emails`. On ne crée pas d'email de secours : si GitHub ne
      // fournit pas d'email, cela révèle un problème de permission OAuth.
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

    databaseHooks: {
      user: {
        create: {
          before: async (user) => createNormalizedUserData(db, user),
        },
      },
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
