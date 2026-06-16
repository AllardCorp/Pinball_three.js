import { randomBytes } from "node:crypto";

export type ScorePersistenceDecision = "discard" | "save" | "save_and_claimable";

export type ScorePersistenceReason =
  | "authenticated_user"
  | "guest_claim_requested"
  | "guest_score_saved_for_leaderboard"
  | "guest_score_below_leaderboard_cutoff"
  | "score_not_significant"
  | "non_arcade_claim_request";

export type AppMode = "web" | "arcade";

export type ScorePersistenceEvaluationInput = {
  finalScore: number;
  isAuthenticated: boolean;
  mode: AppMode;
  playedDurationSeconds: number;
  requestClaim: boolean;
  wouldEnterLeaderboard: boolean;
};

export const SCORE_CLAIM_TTL_MS = 120 * 1000;
export const GUEST_MIN_SIGNIFICANT_DURATION_SECONDS = 20;
export const LEADERBOARD_LIMIT = 100;

export function createScoreClaimCode() {
  return randomBytes(24).toString("base64url");
}

export function getScoreClaimVerificationUrl(
  frontendUrl: string,
  claimCode: string,
) {
  const url = new URL("/score-claim", frontendUrl);
  url.searchParams.set("code", claimCode);
  url.searchParams.set("mode", "arcade");
  return url.toString();
}

export function isScoreSignificant(
  finalScore: number,
  playedDurationSeconds: number,
) {
  return finalScore > 0 && playedDurationSeconds >= GUEST_MIN_SIGNIFICANT_DURATION_SECONDS;
}

// Cette règle détermine si un score invité doit être ignoré,
// sauvegardé pour le classement, ou sauvegardé puis rendu claimable.
export function evaluateScorePersistence(
  input: ScorePersistenceEvaluationInput,
): { decision: ScorePersistenceDecision; reason: ScorePersistenceReason } {
  if (!isScoreSignificant(input.finalScore, input.playedDurationSeconds)) {
    return {
      decision: "discard",
      reason: "score_not_significant",
    };
  }

  if (input.isAuthenticated) {
    return {
      decision: "save",
      reason: "authenticated_user",
    };
  }

  if (input.requestClaim && input.mode !== "arcade") {
    return {
      decision: "save",
      reason: "non_arcade_claim_request",
    };
  }

  if (input.requestClaim && input.mode === "arcade") {
    return {
      decision: "save_and_claimable",
      reason: "guest_claim_requested",
    };
  }

  if (input.wouldEnterLeaderboard) {
    return {
      decision: "save",
      reason: "guest_score_saved_for_leaderboard",
    };
  }

  return {
    decision: "discard",
    reason: "guest_score_below_leaderboard_cutoff",
  };
}
