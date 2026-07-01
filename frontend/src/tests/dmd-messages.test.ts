import { describe, expect, it } from "vitest";

import {
  buildDmdViewModel,
  formatDmdScore,
  type BuildDmdViewModelInput,
} from "../lib/dmd-messages";
import {
  createIdleScoreClaimSessionSnapshot,
  type ScoreClaimSessionSnapshot,
} from "../lib/score-claim-session-store";

const baseInput: BuildDmdViewModelInput = {
  appMode: "arcade",
  attractStep: 0,
  ballInLauncher: false,
  ballsRemaining: [3],
  currentPlayerIndex: 0,
  isPlaying: true,
  leftKickbackActive: true,
  mineHits: 0,
  playerCount: 1,
  rightKickbackActive: true,
  rubiesActive: [false, false, false],
  scoreClaimSnapshot: createIdleScoreClaimSessionSnapshot(),
  scoreMultiplier: 1,
  scores: [0],
  screenMessage: null,
};

function buildViewModel(input: Partial<BuildDmdViewModelInput> = {}) {
  return buildDmdViewModel({
    ...baseInput,
    ...input,
  });
}

function scoreClaimSnapshot(
  input: Partial<ScoreClaimSessionSnapshot>,
): ScoreClaimSessionSnapshot {
  return {
    ...createIdleScoreClaimSessionSnapshot(),
    ...input,
  };
}

class TestBroadcastChannel extends EventTarget {
  static messages: unknown[] = [];

  readonly name: string;

  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null =
    null;

  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null =
    null;

  constructor(name: string) {
    super();
    this.name = name;
  }

  close() {}

  postMessage(message: unknown) {
    TestBroadcastChannel.messages.push(message);
  }
}

function ensureBroadcastChannel() {
  globalThis.BroadcastChannel =
    TestBroadcastChannel as unknown as typeof BroadcastChannel;
}

describe("dmd-messages", () => {
  it("formate les scores avec des espaces lisibles", () => {
    expect(formatDmdScore(1234567)).toBe("1 234 567");
    expect(formatDmdScore(100000000)).toBe("100 000 000");
    expect(formatDmdScore(-50)).toBe("0");
  });

  it("affiche l'attract mode quand aucune partie n'est active", () => {
    const viewModel = buildViewModel({
      ballsRemaining: [0],
      isPlaying: false,
      scores: [0],
    });

    expect(viewModel.id).toBe("attract-0");
    expect(viewModel.headline).toBe("INSERER UNE MONNAIE");
    expect(viewModel.subline).toBe("POUR COMMENCER LA PARTIE");
    expect(viewModel.priority).toBe("P3");
  });

  it("garde le message d'accueil stable pendant l'attract mode", () => {
    const viewModel = buildViewModel({
      attractStep: 2,
      ballsRemaining: [0],
      isPlaying: false,
      scores: [0],
    });

    expect(viewModel.headline).toBe("INSERER UNE MONNAIE");
    expect(viewModel.subline).toBe("POUR COMMENCER LA PARTIE");
  });

  it("reste en attract mode si aucun score reel n'a encore ete genere", () => {
    const viewModel = buildViewModel({
      ballsRemaining: [0, 0],
      isPlaying: false,
      playerCount: 2,
      scores: [0, 0],
    });

    expect(viewModel.id).toBe("attract-0");
    expect(viewModel.headline).toBe("INSERER UNE MONNAIE");
  });

  it("affiche game over après une partie avec score", () => {
    const viewModel = buildViewModel({
      ballsRemaining: [0],
      forceGameOver: true,
      isPlaying: false,
      scores: [42000],
    });

    expect(viewModel.id).toBe("game-over");
    expect(viewModel.headline).toBe("GAME OVER");
    expect(viewModel.subline).toBe("42 000");
    expect(viewModel.priority).toBe("P0");
  });

  it("priorise le score claim sur l'affichage de fin de partie", () => {
    const viewModel = buildViewModel({
      isPlaying: false,
      scoreClaimSnapshot: scoreClaimSnapshot({
        claim: {
          claimCode: "ABC123",
          expiresAt: "2026-01-01T00:00:00.000Z",
          status: "pending",
          verificationUrl: "https://example.test/claim",
        },
        game: {
          finalScore: 9000,
          id: 1,
          playedAt: "2026-01-01T00:00:00.000Z",
          playedDurationSeconds: 120,
        },
        phase: "claim_pending",
      }),
      scores: [9000],
    });

    expect(viewModel.id).toBe("claim-claim_pending");
    expect(viewModel.headline).toBe("SCAN TO CLAIM");
    expect(viewModel.subline).toBe("HEROS EN ATTENTE");
    expect(viewModel.footerLeft).toBe("HALL DES HEROS");
    expect(viewModel.kicker).toBe("RELIQUE SAUVEE");
    expect(viewModel.mode).toBe("score-claim");
  });

  it("ne laisse pas un score claim masquer le score pendant une partie", () => {
    const viewModel = buildViewModel({
      isPlaying: true,
      scoreClaimSnapshot: scoreClaimSnapshot({
        errorMessage: "Ancienne erreur de claim",
        phase: "error",
      }),
      scores: [12500],
    });

    expect(viewModel.mode).toBe("live");
    expect(viewModel.headline).toBe("12 500");
    expect(viewModel.id).toBe("live-score");
  });

  it("garde les erreurs de score claim courtes pour le DMD", () => {
    const viewModel = buildViewModel({
      isPlaying: false,
      scoreClaimSnapshot: scoreClaimSnapshot({
        errorMessage:
          "Le backend a renvoyé un message trop long pour être affiché sur une matrice DMD.",
        game: {
          finalScore: 12000,
          id: 1,
          playedAt: "2026-01-01T00:00:00.000Z",
          playedDurationSeconds: 120,
        },
        phase: "error",
        reason: "Erreur backend détaillée à réserver au backglass.",
      }),
      scores: [12000],
    });

    expect(viewModel.id).toBe("claim-error");
    expect(viewModel.headline).toBe("CLAIM ERROR");
    expect(viewModel.subline).toBe("RITUEL INTERROMPU");
    expect(viewModel.footerLeft).toBe("HALL DES HEROS");
  });

  it("ignore une erreur de score claim isolée pour ne pas masquer l'accueil", () => {
    const viewModel = buildViewModel({
      isPlaying: false,
      scoreClaimSnapshot: scoreClaimSnapshot({
        errorMessage: "Ancienne erreur persistée sans partie associée.",
        phase: "error",
      }),
      scores: [12000],
    });

    expect(viewModel.id).toBe("attract-0");
    expect(viewModel.mode).toBe("attract");
    expect(viewModel.headline).toBe("INSERER UNE MONNAIE");
  });

  it("affiche screenMessage dans la bande basse sans masquer le score live", () => {
    const viewModel = buildViewModel({
      scores: [1250],
      screenMessage: "Mine detruite",
    });

    expect(viewModel.id).toBe("live-score");
    expect(viewModel.headline).toBe("1 250");
    expect(viewModel.eventMessage).toBe("Mine detruite");
    expect(viewModel.backgroundEffect).toBe("mine");
  });

  it("affiche l'invitation de lancement quand la bille est au lanceur", () => {
    const viewModel = buildViewModel({
      ballInLauncher: true,
      scores: [0],
    });

    expect(viewModel.id).toBe("ball-ready");
    expect(viewModel.headline).toBe("0");
    expect(viewModel.eventMessage).toBe("TIRER LE PLUNGER");
    expect(viewModel.priority).toBe("P2");
  });

  it("affiche le score live et les indicateurs existants", () => {
    const viewModel = buildViewModel({
      ballsRemaining: [2],
      mineHits: 2,
      rubiesActive: [true, false, true],
      scoreMultiplier: 3,
      scores: [12345],
    });

    expect(viewModel.id).toBe("live-score");
    expect(viewModel.headline).toBe("12 345");
    expect(viewModel.footerLeft).toBe("PLAYER 1 - BALL 2");
    expect(viewModel.footerRight).toBe("X3 - RUNES 2/3");
    expect(viewModel.livesRemaining).toBe(2);
    expect(viewModel.maxLives).toBe(3);
    expect(viewModel.playerToken).toBe("P1");
    expect(viewModel.activeClass).toBe("warrior");
    expect(viewModel.availableMultipliers).toEqual([2, 6, 8, 12]);
    expect(viewModel.activeMultipliers).toEqual([2]);
    expect(viewModel.mineText).toBe("MINE 2/3");
  });

  it("declenche l'effet rubis quand les trois rubis sont actifs", () => {
    const viewModel = buildViewModel({
      rubiesActive: [true, true, true],
      scores: [36000],
    });

    expect(viewModel.id).toBe("live-score");
    expect(viewModel.backgroundEffect).toBe("ruby");
  });

  it("garde l'effet rubis visible pendant le message de bonus", () => {
    const viewModel = buildViewModel({
      rubiesActive: [false, false, false],
      screenMessage: "TROIS RUBIS - 5000",
      scores: [41000],
    });

    expect(viewModel.id).toBe("live-score");
    expect(viewModel.eventMessage).toBe("TROIS RUBIS - 5000");
    expect(viewModel.backgroundEffect).toBe("ruby");
  });

  it("remplace la piste de multiplicateurs par le bonus soleil x50", () => {
    const viewModel = buildViewModel({
      activeMultipliers: [2, 6, 8, 12],
      isSunBonusActive: true,
      scoreMultiplier: 50,
      scores: [50000],
    });

    expect(viewModel.isSunBonusActive).toBe(true);
    expect(viewModel.backgroundEffect).toBe("sun");
    expect(viewModel.eventMessage).toBe("NAT 20 - DRAGON AWAKES");
  });

  it("diffuse un snapshot complet du store quand le score change", async () => {
    ensureBroadcastChannel();
    TestBroadcastChannel.messages = [];

    const { useGameStore } = await import("../store/gameStore/useGameStore");

    useGameStore.setState({
      ballInLauncher: true,
      ballsRemaining: [0],
      currentPlayerIndex: 0,
      isPlaying: false,
      leftKickbackActive: true,
      mineHits: 0,
      playerCount: 1,
      rightKickbackActive: true,
      rubiesActive: [false, false, false],
      scoreMultiplier: 1,
      scores: [0],
      screenMessage: null,
    });

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);
    useGameStore.getState().addScore(750);

    const latestMessage = TestBroadcastChannel.messages.at(-1);

    // Le DMD et le backglass tournent souvent dans des fenêtres séparées.
    // Chaque mutation doit donc porter assez d'état pour resynchroniser un écran ouvert tard.
    expect(latestMessage).toMatchObject({
      ballInLauncher: false,
      currentPlayerIndex: 0,
      isPlaying: true,
      playerCount: 1,
      scoreMultiplier: 1,
      scores: [750],
    });
  });

  it("affiche un score produit par useGameStore.addScore", async () => {
    ensureBroadcastChannel();

    const { useGameStore } = await import("../store/gameStore/useGameStore");

    useGameStore.setState({
      ballInLauncher: true,
      ballsRemaining: [0],
      currentPlayerIndex: 0,
      isPlaying: false,
      leftKickbackActive: true,
      mineHits: 0,
      playerCount: 1,
      rightKickbackActive: true,
      rubiesActive: [false, false, false],
      scoreMultiplier: 1,
      scores: [0],
      screenMessage: null,
    });

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);
    useGameStore.getState().activateMultiplier("lightRoad");
    useGameStore.getState().addScore(1500);

    const gameState = useGameStore.getState();
    const currentMultiplier = gameState.getCurrentMultiplier();
    const viewModel = buildDmdViewModel({
      activeMultipliers: [currentMultiplier],
      appMode: "arcade",
      ballInLauncher: gameState.ballInLauncher,
      ballsRemaining: gameState.ballsRemaining,
      currentPlayerIndex: gameState.currentPlayerIndex,
      isPlaying: gameState.isPlaying,
      leftKickbackActive: gameState.leftKickbackActive,
      mineHits: gameState.mineHits,
      playerCount: gameState.playerCount,
      rightKickbackActive: gameState.rightKickbackActive,
      rubiesActive: gameState.rubiesActive,
      scoreClaimSnapshot: createIdleScoreClaimSessionSnapshot(),
      scoreMultiplier: currentMultiplier,
      scores: gameState.scores,
      screenMessage: gameState.screenMessage,
    });

    // Le score validé ici vient de la règle réelle du store : 1500 points avec un multiplicateur x2.
    expect(gameState.scores[0]).toBe(3000);
    expect(viewModel.headline).toBe("3 000");
    expect(viewModel.footerRight).toBe("X2 - RUNES 0/3");
  });

  it("affiche les points cumules par les elements de scoring actuels du plateau", async () => {
    ensureBroadcastChannel();

    const { useGameStore } = await import("../store/gameStore/useGameStore");

    useGameStore.setState({
      ballInLauncher: true,
      ballsRemaining: [0],
      currentPlayerIndex: 0,
      isPlaying: false,
      leftKickbackActive: true,
      mineHits: 0,
      playerCount: 1,
      rightKickbackActive: true,
      rubiesActive: [false, false, false],
      scoreMultiplier: 1,
      scores: [0],
      screenMessage: null,
    });

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);

    // Ces valeurs reprennent les sources de points actuellement branchées au playfield :
    // ScoreTarget 50, Slingshot 100, Bumper 500, GoldMine 500, Kickback 2500.
    useGameStore.getState().addScore(50);
    useGameStore.getState().addScore(100);
    useGameStore.getState().addScore(500);
    useGameStore.getState().addScore(500);
    useGameStore.getState().addScore(2500);

    // Les trois rubis déclenchent le bonus réel de 5000 points via toggleRuby.
    useGameStore.getState().toggleRuby(0);
    useGameStore.getState().toggleRuby(1);
    useGameStore.getState().toggleRuby(2);

    const gameState = useGameStore.getState();
    const viewModel = buildDmdViewModel({
      appMode: "arcade",
      ballInLauncher: gameState.ballInLauncher,
      ballsRemaining: gameState.ballsRemaining,
      currentPlayerIndex: gameState.currentPlayerIndex,
      isPlaying: gameState.isPlaying,
      leftKickbackActive: gameState.leftKickbackActive,
      mineHits: gameState.mineHits,
      playerCount: gameState.playerCount,
      rightKickbackActive: gameState.rightKickbackActive,
      rubiesActive: gameState.rubiesActive,
      scoreClaimSnapshot: createIdleScoreClaimSessionSnapshot(),
      scoreMultiplier: gameState.scoreMultiplier,
      scores: gameState.scores,
      screenMessage: gameState.screenMessage,
    });

    expect(gameState.scores[0]).toBe(8650);
    expect(viewModel.headline).toBe("8 650");
    expect(viewModel.footerRight).toBe("X1 - RUNES 0/3");
  });
});
