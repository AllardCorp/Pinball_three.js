import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getScoreClaimDescription,
  getScoreClaimDmdMessage,
  getScoreClaimPhaseLabel,
} from "../lib/score-claim-copy";
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
    description: "Lancez une fin de partie technique pour tester le flux.",
  },
  {
    phase: "submitting",
    label: "Sauvegarde du score",
    dmdMessage: "SAVING SCORE",
    description:
      "La borne enregistre le score final et évalue s'il doit être claimable.",
  },
  {
    phase: "discarded",
    label: "Score ignoré",
    dmdMessage: "SCORE NOT SAVED",
    description: "Le backend a décidé de ne pas conserver ce score.",
  },
  {
    phase: "saved",
    label: "Score sauvegardé",
    dmdMessage: "SCORE SAVED",
    description:
      "Le score est conservé, mais aucun rattachement mobile n'est proposé.",
  },
  {
    phase: "claim_pending",
    label: "En attente de scan",
    dmdMessage: "SCAN TO CLAIM",
    description:
      "Le score est sauvegardé et attend une confirmation explicite sur le téléphone.",
  },
  {
    phase: "claim_approved",
    label: "Score rattaché",
    dmdMessage: "SCORE LINKED",
    description: "Le score est désormais rattaché à un compte joueur.",
  },
  {
    phase: "claim_expired",
    label: "Claim expiré",
    dmdMessage: "CLAIM EXPIRED",
    description: "La fenêtre de rattachement est terminée.",
  },
  {
    phase: "error",
    label: "Erreur",
    dmdMessage: "",
    description: "Le flux de claim a échoué.",
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
