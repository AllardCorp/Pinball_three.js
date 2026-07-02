import type { NextFunction, Request, Response } from "express";

// Erreur HTTP normalisée pour tout le backend.
// L'objectif est de renvoyer un code machine stable (`code`) au frontend,
// sans exposer les messages internes ou une stack trace en production.
export type HttpError = Error & {
  status?: number;
  code?: string;
};

// Fabrique d'erreur utilisée dans les routes et middlewares.
// Elle évite de répéter partout `response.status(...).json(...)` et laisse
// le middleware final formater la réponse de manière uniforme.
export function createHttpError(
  status: number,
  code: string,
  message: string,
): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  error.code = code;
  return error;
}

function isHttpError(error: unknown): error is HttpError {
  // Toute erreur JavaScript peut arriver jusqu'ici. Si elle porte `status`
  // et `code`, on les utilise ; sinon elle sera traitée comme une 500.
  return error instanceof Error;
}

function isInvalidJsonError(
  error: unknown,
): error is SyntaxError & { status: number } {
  return (
    error instanceof SyntaxError &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

export function requestErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (response.headersSent) {
    // Express ne permet plus de modifier la réponse si des headers sont déjà
    // partis. Dans ce cas on délègue au handler par défaut.
    next(error);
    return;
  }

  if (isInvalidJsonError(error)) {
    // `express.json()` lève une SyntaxError sur un JSON invalide.
    // On transforme ce cas fréquent en erreur client claire.
    response.status(400).json({ error: "invalid_json_body" });
    return;
  }

  if (isHttpError(error)) {
    const status = error.status ?? 500;

    if (status >= 500) {
      // Les erreurs serveur sont loggées côté backend, mais le client reçoit
      // seulement un code stable pour éviter les fuites d'informations.
      console.error("Unhandled request error:", error);
    }

    response.status(status).json({
      error: error.code ?? "internal_server_error",
    });
    return;
  }

  console.error("Unhandled request error:", error);
  response.status(500).json({ error: "internal_server_error" });
}
