import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type UseGameStoreModule = typeof import("../store/gameStore/useGameStore");

class TestBroadcastChannel extends EventTarget {
  static instances: TestBroadcastChannel[] = [];
  static messages: unknown[] = [];

  readonly name: string;

  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null =
    null;

  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null =
    null;

  constructor(name: string) {
    super();
    this.name = name;
    TestBroadcastChannel.instances.push(this);
  }

  close() {}

  postMessage(message: unknown) {
    TestBroadcastChannel.messages.push(message);
  }
}

async function importFreshGameStore(): Promise<UseGameStoreModule> {
  vi.resetModules();
  vi.stubGlobal(
    "BroadcastChannel",
    TestBroadcastChannel as unknown as typeof BroadcastChannel,
  );

  return import("../store/gameStore/useGameStore");
}

function resetBroadcastChannel() {
  TestBroadcastChannel.instances = [];
  TestBroadcastChannel.messages = [];
}

function resetGameState(useGameStore: UseGameStoreModule["useGameStore"]) {
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
}

describe("useGameStore", () => {
  beforeEach(() => {
    resetBroadcastChannel();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("centralise le score, les multiplicateurs et la synchronisation des écrans", async () => {
    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(2);
    useGameStore.getState().setBallInLauncher(false);
    useGameStore.getState().addScoreMultiplier();
    useGameStore.getState().addScore(1_500);
    useGameStore.getState().removeScore(1_000);

    const state = useGameStore.getState();

    expect(state.playerCount).toBe(2);
    expect(state.ballsRemaining).toEqual([3, 3]);
    expect(state.scoreMultiplier).toBe(2);
    expect(state.scores).toEqual([2_000, 0]);

    // Chaque mutation diffuse un snapshot complet pour garder le DMD, le
    // backglass et le playfield synchronisés entre plusieurs fenêtres.
    expect(TestBroadcastChannel.messages.at(-1)).toMatchObject({
      ballInLauncher: false,
      currentPlayerIndex: 0,
      isPlaying: true,
      playerCount: 2,
      scoreMultiplier: 2,
      scores: [2_000, 0],
    });
  });

  it("ignore les mutations de score quand aucune partie n'est active", async () => {
    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().addScore(500);
    useGameStore.getState().removeScore(500);
    useGameStore.getState().addScoreMultiplier();
    useGameStore.getState().removeScoreMultiplier();

    expect(useGameStore.getState().scores).toEqual([0]);
    expect(useGameStore.getState().scoreMultiplier).toBe(1);
  });

  it("gère les limites de plateau : mine, rubis, kickbacks et multiplicateur", async () => {
    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);

    for (let i = 0; i < 12; i += 1) {
      useGameStore.getState().addScoreMultiplier();
    }

    expect(useGameStore.getState().scoreMultiplier).toBe(10);

    for (let i = 0; i < 12; i += 1) {
      useGameStore.getState().removeScoreMultiplier();
    }

    expect(useGameStore.getState().scoreMultiplier).toBe(1);

    useGameStore.getState().incrementMine();
    useGameStore.getState().incrementMine();
    useGameStore.getState().incrementMine();
    useGameStore.getState().incrementMine();
    expect(useGameStore.getState().mineHits).toBe(3);

    useGameStore.getState().resetMine();
    expect(useGameStore.getState().mineHits).toBe(0);

    useGameStore.getState().useKickback("left");
    useGameStore.getState().useKickback("right");
    expect(useGameStore.getState().leftKickbackActive).toBe(false);
    expect(useGameStore.getState().rightKickbackActive).toBe(false);

    useGameStore.getState().toggleRuby(0);
    useGameStore.getState().toggleRuby(1);
    useGameStore.getState().toggleRuby(2);

    expect(useGameStore.getState().rubiesActive).toEqual([
      false,
      false,
      false,
    ]);
    expect(useGameStore.getState().scores).toEqual([5_000]);
  });

  it("fait tourner les joueurs puis termine la partie quand toutes les billes sont perdues", async () => {
    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(2);
    useGameStore.setState({
      ballsRemaining: [1, 1],
      currentPlayerIndex: 0,
      isPlaying: true,
    });

    useGameStore.getState().loseBall();
    expect(useGameStore.getState()).toMatchObject({
      ballsRemaining: [0, 1],
      currentPlayerIndex: 1,
      isPlaying: true,
    });

    useGameStore.getState().loseBall();
    expect(useGameStore.getState()).toMatchObject({
      ballsRemaining: [0, 0],
      isPlaying: false,
    });
  });

  it("affiche un message temporaire sans effacer le suivant trop tôt", async () => {
    vi.useFakeTimers();

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().displayMessage("MINE OUVERTE", 1_000);
    useGameStore.getState().displayMessage("RUBIS ACTIF", 1_000);

    vi.advanceTimersByTime(999);
    expect(useGameStore.getState().screenMessage).toBe("RUBIS ACTIF");

    vi.advanceTimersByTime(1);
    expect(useGameStore.getState().screenMessage).toBeNull();
  });

  it("applique les snapshots reçus depuis une autre fenêtre", async () => {
    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    const channel = TestBroadcastChannel.instances[0];
    channel.onmessage?.(
      new MessageEvent("message", {
        data: {
          isPlaying: true,
          scores: [42_000],
        },
      }) as MessageEvent,
    );

    expect(useGameStore.getState()).toMatchObject({
      isPlaying: true,
      scores: [42_000],
    });
  });
});
