import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";

import type { AppSession, GetSession } from "../app-session.js";
import type { DatabaseClient } from "../db/client.js";
import { levels } from "../db/schema.js";
import { parseLevelWritePayload } from "../domain/maker-elements.js";
import { createHttpError } from "../http/errors.js";
import { createRateLimitMiddleware, getClientIp } from "../http/rate-limit.js";
import { readSingleRouteParam } from "../http/request-parsing.js";

// Ce module regroupe tout le CRUD des niveaux du Maker, sur le même principe
// que `leaderboard-routes.ts`/`score-claim-routes.ts` : `app.ts` reste un
// fichier d'assemblage Express, la logique métier vit ici.
type RegisterLevelRoutesDependencies = {
  app: Express;
  db: DatabaseClient;
  getSession: GetSession;
};

const SCREENSHOT_DATA_URL_PREFIX = "data:image/jpeg;base64,";
// Cache long : chaque sauvegarde change l'URL consommée par le frontend
// (suffixe `?v=<updatedAt>`), donc une réponse mise en cache ne devient
// jamais périmée tant que l'URL ne change pas.
const SCREENSHOT_CACHE_CONTROL = "public, max-age=31536000, immutable";

type LevelListRow = {
  id: string;
  name: string;
  userId: string | null;
  hasScreenshot: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type LevelDetailRow = LevelListRow & {
  elements: unknown;
};

function screenshotUrlFor(id: string, hasScreenshot: boolean) {
  return hasScreenshot ? `/api/levels/${id}/screenshot` : null;
}

// `isOwner` est calculé côté serveur pour ne jamais exposer le `userId` brut
// d'un niveau à un client anonyme ou à un autre utilisateur.
function toPublicLevelListItem(row: LevelListRow, currentUserId: string | null) {
  return {
    id: row.id,
    name: row.name,
    screenshotUrl: screenshotUrlFor(row.id, row.hasScreenshot),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isOwner: currentUserId !== null && row.userId === currentUserId,
  };
}

function toPublicLevelDetail(row: LevelDetailRow, currentUserId: string | null) {
  return {
    ...toPublicLevelListItem(row, currentUserId),
    elements: row.elements,
  };
}

function decodeScreenshotDataUrl(screenshotData: unknown): Buffer | null {
  if (typeof screenshotData !== "string" || !screenshotData.startsWith(SCREENSHOT_DATA_URL_PREFIX)) {
    return null;
  }

  const base64 = screenshotData.slice(SCREENSHOT_DATA_URL_PREFIX.length);
  return Buffer.from(base64, "base64");
}

// Factorise la vérification 404/403 partagée par PUT et DELETE : un niveau
// ne peut être modifié ou supprimé que par son propriétaire.
async function loadOwnedLevelOrThrow(db: DatabaseClient, id: string, session: AppSession) {
  const [level] = await db
    .select({
      id: levels.id,
      name: levels.name,
      userId: levels.userId,
      createdAt: levels.createdAt,
      updatedAt: levels.updatedAt,
    })
    .from(levels)
    .where(eq(levels.id, id))
    .limit(1);

  if (!level) {
    throw createHttpError(404, "level_not_found", "Le niveau est introuvable.");
  }

  if (level.userId !== session.user.id) {
    throw createHttpError(
      403,
      "level_forbidden",
      "Vous ne pouvez modifier que vos propres niveaux.",
    );
  }

  return level;
}

export function registerLevelRoutes({ app, db, getSession }: RegisterLevelRoutesDependencies) {
  const limitLevelCreate = createRateLimitMiddleware({
    keyPrefix: "level-create",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    errorCode: "too_many_level_creates",
    message: "Too many level creation requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitLevelUpdate = createRateLimitMiddleware({
    keyPrefix: "level-update",
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
    errorCode: "too_many_level_updates",
    message: "Too many level update requests.",
    resolveKey: (request) => getClientIp(request),
  });

  const limitLevelDelete = createRateLimitMiddleware({
    keyPrefix: "level-delete",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    errorCode: "too_many_level_deletes",
    message: "Too many level deletion requests.",
    resolveKey: (request) => getClientIp(request),
  });

  app.get("/api/levels", async (request, response) => {
    // Lecture publique : la session est lue si présente, uniquement pour
    // calculer `isOwner`, jamais pour exiger une connexion.
    const session = await getSession(request.headers);

    const rows = await db
      .select({
        id: levels.id,
        name: levels.name,
        userId: levels.userId,
        // `IS NOT NULL` ne déclenche jamais la lecture du contenu TOASTé de
        // `screenshot_data` : cette requête reste aussi légère qu'avant,
        // qu'un niveau ait un screenshot ou non.
        hasScreenshot: sql<boolean>`${levels.screenshotData} is not null`,
        createdAt: levels.createdAt,
        updatedAt: levels.updatedAt,
      })
      .from(levels)
      .orderBy(desc(levels.createdAt));

    response.json(rows.map((row) => toPublicLevelListItem(row, session?.user.id ?? null)));
  });

  app.get("/api/levels/:id", async (request, response) => {
    const id = readSingleRouteParam(request.params.id);
    const session = await getSession(request.headers);

    const [level] = await db
      .select({
        id: levels.id,
        name: levels.name,
        userId: levels.userId,
        hasScreenshot: sql<boolean>`${levels.screenshotData} is not null`,
        elements: levels.elements,
        createdAt: levels.createdAt,
        updatedAt: levels.updatedAt,
      })
      .from(levels)
      .where(eq(levels.id, id))
      .limit(1);

    if (!level) {
      response.status(404).json({ error: "level_not_found" });
      return;
    }

    response.json(toPublicLevelDetail(level, session?.user.id ?? null));
  });

  app.get("/api/levels/:id/screenshot", async (request, response) => {
    const id = readSingleRouteParam(request.params.id);

    const [level] = await db
      .select({ screenshotData: levels.screenshotData })
      .from(levels)
      .where(eq(levels.id, id))
      .limit(1);

    if (!level?.screenshotData) {
      response.status(404).json({ error: "screenshot_not_found" });
      return;
    }

    response.set("Content-Type", "image/jpeg");
    response.set("Cache-Control", SCREENSHOT_CACHE_CONTROL);
    response.send(level.screenshotData);
  });

  app.post("/api/levels", limitLevelCreate, async (request, response) => {
    const session = await getSession(request.headers);

    if (!session) {
      throw createHttpError(
        401,
        "authentication_required",
        "Vous devez être connecté pour créer un niveau.",
      );
    }

    const { name, elements } = parseLevelWritePayload(request.body);
    const screenshotData = decodeScreenshotDataUrl(request.body?.screenshot);
    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(levels)
      .values({
        id,
        name,
        userId: session.user.id,
        elements,
        screenshotData,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: levels.id,
        name: levels.name,
        userId: levels.userId,
        hasScreenshot: sql<boolean>`${levels.screenshotData} is not null`,
        createdAt: levels.createdAt,
        updatedAt: levels.updatedAt,
      });

    response.status(201).json(toPublicLevelListItem(created, session.user.id));
  });

  app.put("/api/levels/:id", limitLevelUpdate, async (request, response) => {
    const id = readSingleRouteParam(request.params.id);
    const session = await getSession(request.headers);

    if (!session) {
      throw createHttpError(
        401,
        "authentication_required",
        "Vous devez être connecté pour modifier un niveau.",
      );
    }

    await loadOwnedLevelOrThrow(db, id, session);
    const { name, elements } = parseLevelWritePayload(request.body);
    const newScreenshotData = decodeScreenshotDataUrl(request.body?.screenshot);

    const [updated] = await db
      .update(levels)
      .set({
        name,
        elements,
        // Un `screenshot` absent du body signifie "je ne change pas
        // l'aperçu" : on ne touche alors pas à la colonne existante.
        ...(newScreenshotData ? { screenshotData: newScreenshotData } : {}),
        updatedAt: new Date(),
      })
      .where(eq(levels.id, id))
      .returning({
        id: levels.id,
        name: levels.name,
        userId: levels.userId,
        hasScreenshot: sql<boolean>`${levels.screenshotData} is not null`,
        createdAt: levels.createdAt,
        updatedAt: levels.updatedAt,
      });

    response.json(toPublicLevelListItem(updated, session.user.id));
  });

  app.delete("/api/levels/:id", limitLevelDelete, async (request, response) => {
    const id = readSingleRouteParam(request.params.id);
    const session = await getSession(request.headers);

    if (!session) {
      throw createHttpError(
        401,
        "authentication_required",
        "Vous devez être connecté pour supprimer un niveau.",
      );
    }

    await loadOwnedLevelOrThrow(db, id, session);
    await db.delete(levels).where(eq(levels.id, id));

    response.status(204).send();
  });
}
