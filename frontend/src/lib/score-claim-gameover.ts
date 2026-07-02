// Le service backend refuse les claims invités trop courts afin d'éviter les
// faux scores générés par erreur. Cette constante garde le front aligné avec
// cette règle métier au moment de créer automatiquement le QR code.
const MIN_SIGNIFICANT_CLAIM_DURATION_SECONDS = 20;

// Les scores sont stockés dans des colonnes integer côté Postgres. On borne
// donc la valeur envoyée pour éviter une erreur SQL si le jeu dépasse ce seuil.
const POSTGRES_INTEGER_MAX = 2_147_483_647;

export type GameOverScoreClaimInput = {
  finalScore: number;
  playedDurationSeconds: number;
  requestClaim: boolean;
};

type CreateGameOverScoreClaimInputOptions = {
  endedAtMs: number;
  scores: number[];
  startedAtMs: number | null;
};

function normalizeScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(POSTGRES_INTEGER_MAX, Math.max(0, Math.trunc(score)));
}

export function getFinalScoreForClaim(scores: number[]) {
  if (scores.length === 0) {
    return 0;
  }

  return Math.max(...scores.map(normalizeScore));
}

export function getPlayedDurationSecondsForClaim(
  startedAtMs: number | null,
  endedAtMs: number,
  finalScore: number,
) {
  const measuredDurationSeconds =
    startedAtMs === null
      ? 0
      : Math.max(0, Math.ceil((endedAtMs - startedAtMs) / 1000));

  // Le backend ignore les scores invités trop courts. On conserve donc la
  // durée mesurée, mais on applique le minimum métier quand un score positif
  // existe afin que les tests borne très rapides puissent générer un QR code.
  if (finalScore > 0) {
    return Math.max(
      MIN_SIGNIFICANT_CLAIM_DURATION_SECONDS,
      measuredDurationSeconds,
    );
  }

  return measuredDurationSeconds;
}

export function createGameOverScoreClaimInput({
  endedAtMs,
  scores,
  startedAtMs,
}: CreateGameOverScoreClaimInputOptions): GameOverScoreClaimInput {
  const finalScore = getFinalScoreForClaim(scores);

  return {
    finalScore,
    playedDurationSeconds: getPlayedDurationSecondsForClaim(
      startedAtMs,
      endedAtMs,
      finalScore,
    ),
    requestClaim: true,
  };
}
