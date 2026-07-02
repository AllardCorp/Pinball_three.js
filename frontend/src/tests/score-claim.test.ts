import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getScoreClaimDescription,
  getScoreClaimDmdMessage,
  getScoreClaimPhaseLabel,
} from "../lib/score-claim-copy";
import {
  createGameOverScoreClaimInput,
  getFinalScoreForClaim,
  getPlayedDurationSecondsForClaim,
} from "../lib/score-claim-gameover";
import {
  clearScoreClaimSessionSnapshot,
  createIdleScoreClaimSessionSnapshot,
  readScoreClaimSessionSnapshot,
  subscribeToScoreClaimSessionSnapshot,
  type ScoreClaimSessionPhase,
  type ScoreClaimSessionSnapshot,
  writeScoreClaimSessionSnapshot,
} from "../lib/score-claim-session-store";

const phaseExpectations: Array<{
  phase: ScoreClaimSessionPhase;
  label: string;
  dmdMessage: string;
  description: string;
}> = [
  {
    phase: "idle",
    label: "Prêt",
    dmdMessage: "GAME OVER",
    description: "Le QR code apparaîtra à la fin de la partie.",
  },
  {
    phase: "submitting",
    label: "Préparation du QR code",
    dmdMessage: "SAVING SCORE",
    description: "Sauvegarde du score en cours...",
  },
  {
    phase: "discarded",
    label: "Score non enregistré",
    dmdMessage: "SCORE NOT SAVED",
    description: "Ce score n'a pas été conservé.",
  },
  {
    phase: "saved",
    label: "Score enregistré",
    dmdMessage: "SCORE SAVED",
    description: "Le score est enregistré.",
  },
  {
    phase: "claim_pending",
    label: "Scannez le QR code",
    dmdMessage: "SCAN TO CLAIM",
    description: "Scannez avec votre téléphone pour rattacher le score.",
  },
  {
    phase: "claim_approved",
    label: "Score enregistré",
    dmdMessage: "SCORE LINKED",
    description: "Le score est rattaché à un compte joueur.",
  },
  {
    phase: "claim_expired",
    label: "QR code expiré",
    dmdMessage: "CLAIM EXPIRED",
    description: "Ce QR code n'est plus utilisable.",
  },
  {
    phase: "error",
    label: "QR code indisponible",
    dmdMessage: "",
    description: "Impossible d'afficher le QR code pour le moment.",
  },
];

function snapshotForPhase(
  phase: ScoreClaimSessionPhase,
  input: Partial<ScoreClaimSessionSnapshot> = {},
): ScoreClaimSessionSnapshot {
  return {
    ...createIdleScoreClaimSessionSnapshot(),
    ...input,
    phase,
  };
}

describe("score-claim copy", () => {
  it("fournit des libellés stables pour chaque phase du claim", () => {
    for (const expectation of phaseExpectations) {
      const snapshot = snapshotForPhase(expectation.phase);

      expect(getScoreClaimPhaseLabel(expectation.phase)).toBe(
        expectation.label,
      );
      expect(getScoreClaimDmdMessage(snapshot)).toBe(expectation.dmdMessage);
      expect(getScoreClaimDescription(snapshot)).toBe(
        expectation.description,
      );
    }
  });

  it("affiche le détail d'erreur quand le backend en fournit un", () => {
    const snapshot = snapshotForPhase("error", {
      errorMessage: "Le VPS ne répond pas.",
    });

    expect(getScoreClaimDescription(snapshot)).toBe("Le VPS ne répond pas.");
  });
});

describe("score-claim session store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("crée un snapshot idle explicite quand aucune session n'existe", () => {
    expect(readScoreClaimSessionSnapshot()).toEqual(
      createIdleScoreClaimSessionSnapshot(),
    );
  });

  it("écrit, relit et efface la session partagée entre les écrans", () => {
    const listener = vi.fn();
    window.addEventListener("pinball:score-claim-session-updated", listener);

    const snapshot = snapshotForPhase("claim_pending", {
      claim: {
        claimCode: "ABC123",
        expiresAt: "2026-01-01T12:00:00.000Z",
        status: "pending",
        verificationUrl: "https://pinball.example/claim/ABC123",
      },
      decision: "save_and_claimable",
      game: {
        finalScore: 120_000,
        id: 10,
        playedAt: "2026-01-01T12:00:00.000Z",
        playedDurationSeconds: 180,
      },
      updatedAt: "2026-01-01T12:00:00.000Z",
    });

    writeScoreClaimSessionSnapshot(snapshot);
    expect(readScoreClaimSessionSnapshot()).toEqual(snapshot);
    expect(listener).toHaveBeenCalledTimes(1);

    clearScoreClaimSessionSnapshot();
    expect(readScoreClaimSessionSnapshot()).toEqual(
      createIdleScoreClaimSessionSnapshot(),
    );
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener("pinball:score-claim-session-updated", listener);
  });

  it("notifie les abonnés sur événement local et événement storage", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToScoreClaimSessionSnapshot(listener);

    writeScoreClaimSessionSnapshot(snapshotForPhase("saved"));
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "pinball.score-claim-session",
      }),
    );
    expect(listener).toHaveBeenCalledTimes(2);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "autre-cle",
      }),
    );
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    clearScoreClaimSessionSnapshot();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("retombe sur idle quand la session persistée est illisible", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem("pinball.score-claim-session", "{invalid-json");

    expect(readScoreClaimSessionSnapshot()).toEqual(
      createIdleScoreClaimSessionSnapshot(),
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it("reste sans effet côté rendu serveur où window n'existe pas", () => {
    vi.stubGlobal("window", undefined);

    expect(readScoreClaimSessionSnapshot()).toEqual(
      createIdleScoreClaimSessionSnapshot(),
    );
    expect(() =>
      writeScoreClaimSessionSnapshot(snapshotForPhase("saved")),
    ).not.toThrow();
    expect(() => clearScoreClaimSessionSnapshot()).not.toThrow();

    const unsubscribe = subscribeToScoreClaimSessionSnapshot(vi.fn());
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe("score-claim game over input", () => {
  it("utilise le meilleur score réel de la partie", () => {
    expect(getFinalScoreForClaim([12_000, 98_500, 42_000])).toBe(98_500);
  });

  it("normalise les scores invalides avant envoi au backend", () => {
    expect(getFinalScoreForClaim([Number.NaN, -50, 12.9])).toBe(12);
  });

  it("applique la durée minimale métier pour un score positif très court", () => {
    expect(getPlayedDurationSecondsForClaim(1_000, 3_500, 10_000)).toBe(20);
  });

  it("conserve la durée réelle quand elle dépasse le minimum", () => {
    expect(getPlayedDurationSecondsForClaim(1_000, 35_100, 10_000)).toBe(35);
  });

  it("prépare le payload automatique de fin de partie", () => {
    expect(
      createGameOverScoreClaimInput({
        endedAtMs: 31_000,
        scores: [1_000, 25_000],
        startedAtMs: 1_000,
      }),
    ).toEqual({
      finalScore: 25_000,
      playedDurationSeconds: 30,
      requestClaim: true,
    });
  });
});
