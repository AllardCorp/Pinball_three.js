import { z } from "zod";

import { createHttpError } from "../http/errors.js";

// Cette liste DOIT rester synchronisée avec les clés de
// MAKER_ELEMENT_CONFIG dans frontend/src/config/makerElementConfig.ts.
// Il n'existe pas de package partagé entre le frontend et le backend :
// ajouter un type d'élément nécessite de mettre à jour les deux fichiers.
export const MAKER_ELEMENT_TYPES = ["cylinder", "box", "sphere"] as const;

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const makerElementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.enum(MAKER_ELEMENT_TYPES),
  position: vector3Schema,
  rotation: vector3Schema,
  scale: vector3Schema,
  color: z.string().max(32).optional(),
  roughness: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
  isBumper: z.boolean().optional(),
  bumpStrength: z.number().min(0).max(1000).optional(),
});

export const makerElementsSchema = z.array(makerElementSchema).max(500);

export type MakerElement = z.infer<typeof makerElementSchema>;

export type LevelWritePayload = {
  name: string;
  elements: MakerElement[];
};

// Partagé par POST et PUT : les deux routes d'écriture doivent appliquer
// exactement la même frontière de validation.
export function parseLevelWritePayload(body: unknown): LevelWritePayload {
  const requestBody =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const name = String(requestBody.name ?? "").trim();
  if (!name) {
    throw createHttpError(400, "level_name_required", "Le nom du niveau est requis.");
  }

  const elementsResult = makerElementsSchema.safeParse(requestBody.elements);
  if (!elementsResult.success) {
    throw createHttpError(
      400,
      "level_elements_invalid",
      "Les éléments du niveau sont invalides.",
    );
  }

  return { name, elements: elementsResult.data };
}
