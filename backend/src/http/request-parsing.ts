import { createHttpError } from "./errors.js";

// PostgreSQL `integer` est limité à 32 bits signé.
// On borne les scores/durées avant insertion pour éviter une erreur SQL tardive.
export const postgresIntegerMax = 2_147_483_647;

function isDecimalIntegerText(value: string): boolean {
  const trimmedValue = value.trim();
  const firstDigitIndex = trimmedValue.startsWith("-") ? 1 : 0;

  if (trimmedValue.length === firstDigitIndex) {
    return false;
  }

  // Validation explicite plutôt qu'une regex : elle est plus lisible pour la
  // soutenance et évite les surprises liées aux formats numériques ambigus.
  for (let index = firstDigitIndex; index < trimmedValue.length; index += 1) {
    const character = trimmedValue[index];

    if (character < "0" || character > "9") {
      return false;
    }
  }

  return true;
}

export function readSingleRouteParam(value: string | string[] | undefined): string {
  // Express peut typer certains paramètres comme tableau.
  // Nos routes attendent toujours un seul identifiant dans l'URL.
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseRequiredInteger(
  fieldName: string,
  value: unknown,
  options: { max?: number; min?: number } = {},
) {
  // Les clients peuvent envoyer les nombres comme number ou string.
  // On accepte les deux, mais seulement si la valeur est un entier strict.
  const normalizedValue = (() => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (isDecimalIntegerText(trimmedValue)) {
        return Number(trimmedValue);
      }
    }

    return Number.NaN;
  })();

  if (!Number.isSafeInteger(normalizedValue)) {
    // On renvoie un code d'erreur spécifique au champ pour que le frontend ou
    // les tests puissent diagnostiquer précisément la donnée invalide.
    throw createHttpError(400, `${fieldName}_invalid`, `${fieldName} must be an integer.`);
  }

  if (typeof options.min === "number" && normalizedValue < options.min) {
    throw createHttpError(
      400,
      `${fieldName}_out_of_range`,
      `${fieldName} must be greater than or equal to ${options.min}.`,
    );
  }

  if (typeof options.max === "number" && normalizedValue > options.max) {
    throw createHttpError(
      400,
      `${fieldName}_out_of_range`,
      `${fieldName} must be less than or equal to ${options.max}.`,
    );
  }

  return normalizedValue;
}

export function parseBooleanFlag(value: unknown) {
  // Les formulaires/API peuvent transmettre un booléen réel ou une string.
  // `undefined` vaut false pour les flags optionnels comme `requestClaim`.
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (typeof value === "undefined") {
    return false;
  }

  throw createHttpError(400, "invalid_boolean_flag", "Boolean flag is invalid.");
}
