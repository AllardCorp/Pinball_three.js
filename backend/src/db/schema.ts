import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Better Auth devient la source de verite pour l'authentification.
// Les tables métier continuent ensuite de se rattacher a l'utilisateur auth.
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    username: text("username"),
    displayUsername: text("display_username"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    usernameUnique: uniqueIndex("users_username_unique").on(table.username),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tokenUnique: uniqueIndex("sessions_token_unique").on(table.token),
    userIdIndex: index("sessions_user_id_idx").on(table.userId),
  }),
);

// Table account qui servira à stocker les informations d'authentification,
// y compris les tokens d'accès pour les fournisseurs sociaux et les mots de
// passe pour l'authentification par email.
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    userIdIndex: index("accounts_user_id_idx").on(table.userId),
  }),
);

// Table de vérification utilisée pour vérifier les conditions
// d'authentification, comme la vérification de l'email ou les tokens
// de réinitialisation de mot de passe.
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    identifierIndex: index("verifications_identifier_idx").on(table.identifier),
    valueUnique: uniqueIndex("verifications_value_unique").on(table.value),
  }),
);

export const scoreClaimStatusValues = [
  "pending",
  "approved",
  "expired",
] as const;

export type ScoreClaimStatus = (typeof scoreClaimStatusValues)[number];

export const scoreClaimStatusEnum = pgEnum(
  "score_claim_status",
  scoreClaimStatusValues,
);

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  // Le score doit pouvoir exister sans compte pour supporter les invités.
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  playedDurationSeconds: integer("played_duration_seconds").notNull(),
  finalScore: integer("final_score").notNull(),
  playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIndex: index("games_user_id_idx").on(table.userId),
  finalScoreIndex: index("games_final_score_idx").on(table.finalScore),
  playedAtIndex: index("games_played_at_idx").on(table.playedAt),
}));

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  pointsEarned: integer("points_earned").notNull(),
  collisionEvent: text("collision_event").notNull(),
  gameTimestamp: doublePrecision("game_timestamp").notNull(),
});

export const levels = pgTable(
  "levels",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    elements: jsonb("elements").notNull().default([]),
    screenshotUrl: text("screenshot_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index("levels_user_id_idx").on(table.userId),
    createdAtIndex: index("levels_created_at_idx").on(table.createdAt),
  }),
);

export const scoreClaimRequests = pgTable(
  "score_claim_requests",
  {
    id: text("id").primaryKey(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    claimCode: text("claim_code").notNull(),
    status: scoreClaimStatusEnum("status").notNull().default("pending"),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => ({
    gameIdUnique: uniqueIndex("score_claim_requests_game_id_unique").on(table.gameId),
    claimCodeUnique: uniqueIndex("score_claim_requests_claim_code_unique").on(table.claimCode),
    statusIndex: index("score_claim_requests_status_idx").on(table.status),
    userIdIndex: index("score_claim_requests_user_id_idx").on(table.userId),
  }),
);
