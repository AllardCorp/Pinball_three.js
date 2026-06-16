import { useEffect, useState } from "react";

import { apiEndpoint } from "../lib/api";

export type ScoreClaimPageStatus =
  | "idle"
  | "loading"
  | "pending"
  | "approved"
  | "expired"
  | "not_found"
  | "error";

export type ScoreClaimGame = {
  id: number;
  finalScore: number;
  playedAt: string;
  playedDurationSeconds: number;
};

export type ScoreClaimUser = {
  username: string | null;
};

type ScoreClaimPayload = {
  approvedAt: string | null;
  expiresAt: string;
  game: ScoreClaimGame;
  status: "pending" | "approved";
  user: ScoreClaimUser | null;
};

type UseScoreClaimOptions = {
  claimCode: string;
};

export function useScoreClaim({ claimCode }: UseScoreClaimOptions) {
  const [status, setStatus] = useState<ScoreClaimPageStatus>(
    claimCode ? "loading" : "idle",
  );
  const [claim, setClaim] = useState<ScoreClaimPayload | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (!claimCode) {
      setStatus("idle");
      setClaim(null);
      return;
    }

    // Ce hook charge l'état d'une demande de claim déjà créée côté borne.
    // Il sert aussi à lancer l'approbation finale depuis le téléphone.
    const abortController = new AbortController();

    async function fetchScoreClaim() {
      try {
        setStatus("loading");
        setFeedback(null);

        const response = await fetch(
          apiEndpoint(`/api/score-claims/status/${claimCode}`),
          {
            signal: abortController.signal,
          },
        );

        if (response.status === 404) {
          setStatus("not_found");
          return;
        }

        if (response.status === 410) {
          setStatus("expired");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const payload = (await response.json()) as ScoreClaimPayload;
        setClaim(payload);
        setStatus(payload.status);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Score claim lookup failed:", error);
          setStatus("error");
        }
      }
    }

    void fetchScoreClaim();

    return () => {
      abortController.abort();
    };
  }, [claimCode]);

  async function approveScoreClaim() {
    setFeedback(null);
    setIsApproving(true);

    try {
      // L'utilisateur confirme explicitement qu'il veut rattacher ce score
      // déjà sauvegardé à son compte courant.
      const response = await fetch(apiEndpoint("/api/score-claims/approve"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimCode }),
      });

      if (response.status === 404) {
        setStatus("not_found");
        setFeedback("Cette demande n'existe plus.");
        return;
      }

      if (response.status === 410) {
        setStatus("expired");
        setFeedback("Le délai pour rattacher ce score est expiré.");
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFeedback(payload?.error ?? "Impossible de rattacher ce score.");
        return;
      }

      const payload = (await response.json()) as {
        game: ScoreClaimGame;
        status: "approved";
      };

      setClaim((currentClaim) =>
        currentClaim
          ? {
              ...currentClaim,
              game: payload.game,
              status: payload.status,
            }
          : currentClaim,
      );
      setStatus("approved");
      setFeedback("Le score a bien été rattaché à votre compte.");
    } finally {
      setIsApproving(false);
    }
  }

  return {
    approveScoreClaim,
    claim,
    feedback,
    isApproving,
    status,
  };
}
