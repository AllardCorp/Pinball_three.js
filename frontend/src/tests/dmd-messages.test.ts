import { describe, expect, it } from "vitest";

import type { BuildDmdViewModelInput } from "../lib/dmd-messages";
import {
  buildDmdViewModel,
  createDmdMultiplierSnapshot,
  formatDmdScore,
} from "../lib/dmd-messages";

const baseInput: BuildDmdViewModelInput = {
  activeClass: "None",
  activeMultipliers: {},
  appMode: "arcade",
  ballInLauncher: false,
  ballsRemaining: [3],
  currentPlayerIndex: 0,
  isPlaying: true,
  isPowerOnCooldown: false,
  isUndeathActive: false,
  mineHits: 0,
  playerCount: 1,
  rubyAnimationVisible: true,
  rubiesActive: [false, false, false],
  scores: [0],
  screenMessage: null,
  swordActive: false,
};

function build(overrides: Partial<BuildDmdViewModelInput> = {}) {
  return buildDmdViewModel({
    ...baseInput,
    ...overrides,
  });
}

describe("dmd-messages", () => {
  it("formate les gros scores sans deborder en texte brut", () => {
    expect(formatDmdScore(100000000)).toBe("100 000 000");
    expect(formatDmdScore(15850.9)).toBe("15 850");
    expect(formatDmdScore(-200)).toBe("0");
  });

  it("affiche l'ecran d'accueil quand aucune partie n'est lancee", () => {
    const viewModel = build({ isPlaying: false });

    expect(viewModel.mode).toBe("attract");
    expect(viewModel.headline).toBe("le donjon vous attend");
    expect(viewModel.isAttractMode).toBe(true);
  });

  it("affiche game over avec le dernier score connu", () => {
    const viewModel = build({
      forceGameOver: true,
      isPlaying: false,
      scores: [15850],
    });

    expect(viewModel.mode).toBe("game-over");
    expect(viewModel.headline).toBe("FIN DE PARTIE");
    expect(viewModel.scoreText).toBe("15 850");
  });

  it("utilise l'icone de la classe active et pas le numero du joueur", () => {
    expect(build({ activeClass: "Warrior" }).activeClass).toBe("warrior");
    expect(build({ activeClass: "Elf" }).activeClass).toBe("elf");
    expect(build({ activeClass: "Necromancer" }).activeClass).toBe(
      "necromancer",
    );
    expect(build({ activeClass: "Dwarf" }).activeClass).toBe("dwarf");
    expect(build({ activeClass: "None", currentPlayerIndex: 1 }).activeClass).toBe(
      null,
    );
  });

  it("allume les multiplicateurs disponibles dans le store", () => {
    const activeMultipliers = createDmdMultiplierSnapshot({
      fakir: 4,
      rampHabitLeft: 8,
    });
    const viewModel = build({ activeMultipliers });

    expect(viewModel.currentMultiplier).toBe(8);
    expect(viewModel.multiplierSlots.filter((slot) => slot.active)).toEqual([
      { active: true, label: "X4", value: 4 },
      { active: true, label: "X8", value: 8 },
    ]);
  });

  it("remplace la ligne des multiplicateurs par x50 pendant le bonus soleil", () => {
    const activeMultipliers = createDmdMultiplierSnapshot({
      sunBonus: 50,
    });
    const viewModel = build({ activeMultipliers });

    expect(viewModel.currentMultiplier).toBe(50);
    expect(viewModel.isSunBonusActive).toBe(true);
    expect(viewModel.backgroundEffect).toBe("sun");
    expect(viewModel.eventMessage).toBe("20 NATUREL - DRAGON EVEILLE");
  });

  it("declenche l'animation rubis via le multiplicateur gems meme apres reset des rubis", () => {
    const activeMultipliers = createDmdMultiplierSnapshot({
      gems: 12,
    });
    const viewModel = build({
      activeMultipliers,
      rubiesActive: [false, false, false],
    });

    expect(viewModel.backgroundEffect).toBe("ruby");
  });

  it("masque l'animation rubis sans couper le multiplicateur gems", () => {
    const activeMultipliers = createDmdMultiplierSnapshot({
      gems: 12,
    });
    const viewModel = build({
      activeMultipliers,
      rubyAnimationVisible: false,
    });

    expect(viewModel.currentMultiplier).toBe(12);
    expect(viewModel.backgroundEffect).toBe("none");
  });

  it("priorise les messages importants du plateau", () => {
    expect(build({ ballInLauncher: true }).eventMessage).toBe("TIREZ LE LANCEUR");
    expect(build({ swordActive: true }).eventMessage).toBe("UNE EPEE EST APPARUE");
    expect(build({ screenMessage: "Entrée de la mine ouverte" }).backgroundEffect).toBe(
      "mine",
    );
  });

  it("affiche le statut de rattachement de score sans QR code sur le DMD", () => {
    const viewModel = build({
      isPlaying: false,
      scoreClaimSnapshot: {
        claim: {
          claimCode: "abc",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          status: "pending",
          verificationUrl: "https://pinball.example/score-claim?code=abc",
        },
        decision: "save_and_claimable",
        errorMessage: null,
        game: {
          finalScore: 123456,
          id: 1,
          playedAt: new Date().toISOString(),
          playedDurationSeconds: 95,
        },
        phase: "claim_pending",
        reason: "guest_claim_requested",
        updatedAt: new Date().toISOString(),
        user: null,
      },
    });

    expect(viewModel.mode).toBe("score-claim");
    expect(viewModel.headline).toBe("SCANNEZ LE QR");
    expect(viewModel.scoreText).toBe("123 456");
  });
});
