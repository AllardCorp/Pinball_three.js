export type ScoreClaimDecision = "discard" | "save" | "save_and_claimable";

export type ScoreClaimGame = {
  id: number;
  finalScore: number;
  playedAt: string;
  playedDurationSeconds: number;
};

export type ScoreClaimUser = {
  username: string | null;
};

export type ScoreClaimRequest = {
  claimCode: string;
  expiresAt: string;
  status: "pending" | "approved";
  verificationUrl: string;
};

export type ScoreClaimSessionPhase =
  | "idle"
  | "submitting"
  | "discarded"
  | "saved"
  | "claim_pending"
  | "claim_approved"
  | "claim_expired"
  | "error";

export type ScoreClaimSessionSnapshot = {
  phase: ScoreClaimSessionPhase;
  decision: ScoreClaimDecision | null;
  reason: string | null;
  game: ScoreClaimGame | null;
  claim: ScoreClaimRequest | null;
  user: ScoreClaimUser | null;
  errorMessage: string | null;
  updatedAt: string | null;
};

const SCORE_CLAIM_SESSION_STORAGE_KEY = "pinball.score-claim-session";
const SCORE_CLAIM_SESSION_EVENT = "pinball:score-claim-session-updated";

// Cette structure shared sert de support technique provisoire entre les
// trois écrans. On pourra la remplacer plus tard par un bus d'événements
// dédié quand l'intégration borne sera finalisée.
export function createIdleScoreClaimSessionSnapshot(): ScoreClaimSessionSnapshot {
  return {
    phase: "idle",
    decision: null,
    reason: null,
    game: null,
    claim: null,
    user: null,
    errorMessage: null,
    updatedAt: null,
  };
}

export function readScoreClaimSessionSnapshot(): ScoreClaimSessionSnapshot {
  if (typeof window === "undefined") {
    return createIdleScoreClaimSessionSnapshot();
  }

  const rawValue = window.localStorage.getItem(SCORE_CLAIM_SESSION_STORAGE_KEY);

  if (!rawValue) {
    return createIdleScoreClaimSessionSnapshot();
  }

  try {
    return JSON.parse(rawValue) as ScoreClaimSessionSnapshot;
  } catch (error) {
    console.error("Score claim session snapshot parsing failed:", error);
    return createIdleScoreClaimSessionSnapshot();
  }
}

export function writeScoreClaimSessionSnapshot(
  snapshot: ScoreClaimSessionSnapshot,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SCORE_CLAIM_SESSION_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  window.dispatchEvent(new CustomEvent(SCORE_CLAIM_SESSION_EVENT));
}

export function clearScoreClaimSessionSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SCORE_CLAIM_SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SCORE_CLAIM_SESSION_EVENT));
}

export function subscribeToScoreClaimSessionSnapshot(
  listener: () => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SCORE_CLAIM_SESSION_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SCORE_CLAIM_SESSION_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SCORE_CLAIM_SESSION_EVENT, listener);
  };
}
