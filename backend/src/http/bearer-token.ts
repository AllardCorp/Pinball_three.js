import { timingSafeEqual } from "node:crypto";

// Lit uniquement le format standard `Authorization: Bearer <token>`.
// On ne supporte pas d'autres formats pour éviter une authentification ambiguë.
export function readBearerToken(authorizationHeader: string | undefined): string | null {
  const bearerPrefix = "Bearer ";

  if (!authorizationHeader?.startsWith(bearerPrefix)) {
    return null;
  }

  const token = authorizationHeader.slice(bearerPrefix.length).trim();
  return token.length > 0 ? token : null;
}

// Comparaison en temps constant pour éviter de révéler progressivement le token
// via des différences de temps de réponse. C'est important pour BORNE_TOKEN,
// qui autorise une borne physique à créer des claims sur le VPS.
export function tokensMatch(providedToken: string, expectedToken: string): boolean {
  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (providedBuffer.length !== expectedBuffer.length) {
    // `timingSafeEqual` exige deux buffers de même taille.
    // On refuse immédiatement les tailles différentes.
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
