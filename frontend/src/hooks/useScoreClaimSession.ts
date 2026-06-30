import { useEffect, useMemo, useState } from "react";

import { useSession } from "../lib/auth-client";
import { apiEndpoint } from "../lib/api";
import type { AppMode } from "../lib/app-mode";
import {
  clearScoreClaimSessionSnapshot,
  createIdleScoreClaimSessionSnapshot,
  readScoreClaimSessionSnapshot,
  subscribeToScoreClaimSessionSnapshot,
  writeScoreClaimSessionSnapshot,
  type ScoreClaimDecision,
  type ScoreClaimGame,
  type ScoreClaimRequest,
  type ScoreClaimSessionSnapshot,
  type ScoreClaimUser,
} from "../lib/score-claim-session-store";

type StartScoreClaimSessionInput = {
  finalScore: number;
  playedDurationSeconds: number;
  requestClaim: boolean;
};

type ScoreClaimStartResponse = {
  decision: ScoreClaimDecision;
  reason: string;
  game: ScoreClaimGame | null;
  claim: ScoreClaimRequest | null;
};

type ScoreClaimStatusResponse = {
  approvedAt: string | null;
  expiresAt: string;
  game: ScoreClaimGame;
  status: "pending" | "approved";
  user: ScoreClaimUser | null;
};

type UseScoreClaimSessionOptions = {
  enabled?: boolean;
  mode: AppMode;
};

function stampSnapshot(
  snapshot: Omit<ScoreClaimSessionSnapshot, "updatedAt">,
): ScoreClaimSessionSnapshot {
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
}

export function useScoreClaimSession({
  enabled = false,
  mode,
}: UseScoreClaimSessionOptions) {
  const { data: session, isPending: isSessionPending } = useSession();
  const [snapshot, setSnapshot] = useState<ScoreClaimSessionSnapshot>(() =>
    readScoreClaimSessionSnapshot(),
  );

  useEffect(() => {
    // Le localStorage joue ici le rôle de canal technique minimal entre
    // Playfield, Backglass et DMD pendant la phase de validation du flux.
    return subscribeToScoreClaimSessionSnapshot(() => {
      setSnapshot(readScoreClaimSessionSnapshot());
    });
  }, []);

  useEffect(() => {
    if (snapshot.phase !== "claim_pending" || !snapshot.claim?.claimCode) {
      return;
    }

    let isCancelled = false;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(
          apiEndpoint(`/api/score-claims/status/${snapshot.claim?.claimCode}`),
        );

        if (isCancelled) {
          return;
        }

        if (response.status === 410) {
          const nextSnapshot = stampSnapshot({
            ...snapshot,
            phase: "claim_expired",
          });
          setSnapshot(nextSnapshot);
          writeScoreClaimSessionSnapshot(nextSnapshot);
          window.clearInterval(intervalId);
          return;
        }

        if (!response.ok) {
          const nextSnapshot = stampSnapshot({
            ...snapshot,
            errorMessage: "QR CODE EXPIRÉ",
            phase: "error",
          });
          setSnapshot(nextSnapshot);
          writeScoreClaimSessionSnapshot(nextSnapshot);
          window.clearInterval(intervalId);
          return;
        }

        const payload = (await response.json()) as ScoreClaimStatusResponse;

        if (payload.status === "approved") {
          const nextSnapshot = stampSnapshot({
            ...snapshot,
            game: payload.game,
            user: payload.user,
            claim: snapshot.claim
              ? {
                  ...snapshot.claim,
                  expiresAt: payload.expiresAt,
                  status: "approved",
                }
              : null,
            phase: "claim_approved",
          });
          setSnapshot(nextSnapshot);
          writeScoreClaimSessionSnapshot(nextSnapshot);
          window.clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Score claim session polling failed:", error);
        if (!isCancelled) {
          const nextSnapshot = stampSnapshot({
            ...snapshot,
            errorMessage: "Le polling du claim a échoué.",
            phase: "error",
          });
          setSnapshot(nextSnapshot);
          writeScoreClaimSessionSnapshot(nextSnapshot);
          window.clearInterval(intervalId);
        }
      }
    }, 2000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [snapshot]);

  async function startScoreClaimSession({
    finalScore,
    playedDurationSeconds,
    requestClaim,
  }: StartScoreClaimSessionInput) {
    if (!enabled) {
      const nextSnapshot = stampSnapshot({
        ...createIdleScoreClaimSessionSnapshot(),
        errorMessage: "Le flux borne score claim n'est actif qu'en mode arcade.",
        phase: "error",
      });
      setSnapshot(nextSnapshot);
      writeScoreClaimSessionSnapshot(nextSnapshot);
      return;
    }

    const submittingSnapshot = stampSnapshot({
      ...createIdleScoreClaimSessionSnapshot(),
      phase: "submitting",
    });
    setSnapshot(submittingSnapshot);
    writeScoreClaimSessionSnapshot(submittingSnapshot);

    try {
      const response = await fetch(apiEndpoint("/api/score-claims/start"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalScore,
          mode,
          playedDurationSeconds,
          requestClaim,
        }),
      });

      if (!response.ok) {
        const nextSnapshot = stampSnapshot({
          ...createIdleScoreClaimSessionSnapshot(),
          errorMessage: "Impossible de démarrer la sauvegarde du score.",
          phase: "error",
        });
        setSnapshot(nextSnapshot);
        writeScoreClaimSessionSnapshot(nextSnapshot);
        return;
      }

      const payload = (await response.json()) as ScoreClaimStartResponse;

      const nextSnapshot = stampSnapshot({
        claim: payload.claim,
        decision: payload.decision,
        errorMessage: null,
        game: payload.game,
        phase:
          payload.decision === "discard"
            ? "discarded"
            : payload.decision === "save"
              ? "saved"
              : "claim_pending",
        reason: payload.reason,
        user: null,
      });

      setSnapshot(nextSnapshot);
      writeScoreClaimSessionSnapshot(nextSnapshot);
    } catch (error) {
      console.error("Score claim session start failed:", error);
      const nextSnapshot = stampSnapshot({
        ...createIdleScoreClaimSessionSnapshot(),
        errorMessage: "La création du claim a échoué.",
        phase: "error",
      });
      setSnapshot(nextSnapshot);
      writeScoreClaimSessionSnapshot(nextSnapshot);
    }
  }

  function resetScoreClaimSession() {
    clearScoreClaimSessionSnapshot();
    setSnapshot(createIdleScoreClaimSessionSnapshot());
  }

  const timeRemainingMs = useMemo(() => {
    if (!snapshot.claim?.expiresAt) {
      return null;
    }

    return Math.max(0, new Date(snapshot.claim.expiresAt).getTime() - Date.now());
  }, [snapshot.claim?.expiresAt, snapshot.updatedAt]);

  return {
    authenticatedUser: session?.user ?? null,
    isSessionPending,
    resetScoreClaimSession,
    snapshot,
    startScoreClaimSession,
    timeRemainingMs,
  };
}
