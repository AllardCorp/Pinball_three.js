import type { Request, RequestHandler } from "express";

import { createHttpError } from "./errors.js";

// Le rate-limit est volontairement simple et en mémoire.
// C'est suffisant pour un backend mono-instance de borne/VPS de projet, mais
// il faudra le remplacer par Redis ou équivalent si plusieurs instances backend
// tournent derrière un load balancer.
type RateLimitBucket = {
  count: number;
  resetAt: number;
};

// Chaque route choisit sa clé et ses limites.
// Cela permet par exemple de limiter par IP, puis par claimCode sur la même route.
type RateLimitRule = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  errorCode: string;
  message: string;
  resolveKey: (request: Request) => string;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

export function resetRateLimitStoreForTests() {
  // Les tests doivent rester isolés : sans reset, une suite peut polluer la
  // suivante en consommant les quotas de rate-limit.
  rateLimitStore.clear();
}

export function getClientIp(request: Request): string {
  // `request.ip` respecte `trust proxy`. Le fallback socket sert surtout aux
  // tests et aux environnements sans proxy.
  return request.ip || request.socket.remoteAddress || "unknown";
}

function cleanupRateLimitStore(now: number) {
  // Nettoyage opportuniste : on évite un interval global permanent.
  // Le store est purgé uniquement quand une requête arrive.
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function createRateLimitMiddleware(rule: RateLimitRule): RequestHandler {
  return (request, _response, next) => {
    const now = Date.now();
    const bucketKey = `${rule.keyPrefix}:${rule.resolveKey(request)}`;
    const currentBucket = rateLimitStore.get(bucketKey);

    // Le rate limit reste en mémoire pour l'instant.
    // Ce n'est pas encore distribué, mais cela suffit pour le flux local actuel.
    if (rateLimitStore.size > 2_000) {
      cleanupRateLimitStore(now);
    }

    if (!currentBucket || currentBucket.resetAt <= now) {
      // Nouveau créneau de temps : on initialise le compteur et sa date
      // d'expiration.
      rateLimitStore.set(bucketKey, {
        count: 1,
        resetAt: now + rule.windowMs,
      });
      next();
      return;
    }

    if (currentBucket.count >= rule.maxRequests) {
      // On passe par `next(error)` pour conserver le format d'erreur HTTP
      // centralisé dans `requestErrorHandler`.
      next(createHttpError(429, rule.errorCode, rule.message));
      return;
    }

    currentBucket.count += 1;
    next();
  };
}
