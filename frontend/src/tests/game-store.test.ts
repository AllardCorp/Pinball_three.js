import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLASS_COOLDOWNS,
  ELF_POWER_CONFIG,
  MULTIPLIERS_CONFIG,
  SWORD_SPAWN_TIMERS,
  SUN_BONUS_REQUIRED_SOURCES,
} from "../config/gameBalancingConfig";

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
    activeBalls: [{ id: "test_ball", origin: "launcher" }],
    activeClass: "None",
    activeMultipliers: {},
    ballInLauncher: true,
    ballsRemaining: [0],
    currentPlayerIndex: 0,
    isPlaying: false,
    isPowerOnCooldown: false,
    isUndeathActive: false,
    leftKickbackActive: true,
    mineHits: 0,
    playerCount: 1,
    powerCooldownExpiresAt: 0,
    powerCooldownTotalDuration: 0,
    rightKickbackActive: true,
    rubiesActive: [false, false, false],
    scoreMultiplier: 1,
    scores: [0],
    screenMessage: null,
    swordActive: false,
    swordPositionIndex: 0,
    swordSpawnTimeoutId: null,
    warriorImpulseTrigger: 0,
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
    useGameStore.getState().activateMultiplier("lightRoad");
    useGameStore.getState().addScore(1_500);
    useGameStore.getState().removeScore(1_000);

    const state = useGameStore.getState();

    expect(state.playerCount).toBe(2);
    expect(state.ballsRemaining).toEqual([3, 3]);
    expect(state.getCurrentMultiplier()).toBe(2);
    expect(state.scores).toEqual([2_000, 0]);

    // Chaque mutation diffuse un snapshot complet pour garder le DMD, le
    // backglass et le playfield synchronisés entre plusieurs fenêtres.
    expect(TestBroadcastChannel.messages.at(-1)).toMatchObject({
      ballInLauncher: false,
      currentPlayerIndex: 0,
      isPlaying: true,
      playerCount: 2,
      scoreMultiplier: 1,
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

    vi.useFakeTimers();
    useGameStore.getState().toggleRuby(0);
    useGameStore.getState().toggleRuby(1);
    useGameStore.getState().toggleRuby(2);

    expect(useGameStore.getState().rubiesActive).toEqual([
      false,
      false,
      false,
    ]);
    expect(useGameStore.getState().scores).toEqual([5_000]);
    expect(useGameStore.getState().screenMessage).toBe("TROIS RUBIS - 5000");

    vi.advanceTimersByTime(3500);
    expect(useGameStore.getState().screenMessage).toBeNull();
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

  it("fait apparaitre une épée puis attribue une classe jouable", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    // Hors partie, l'épée ne doit pas apparaître : cela évite une interaction
    // fantôme sur les écrans d'accueil ou de fin.
    useGameStore.getState().spawnSword();
    expect(useGameStore.getState().swordActive).toBe(false);

    useGameStore.getState().startGame(1);
    useGameStore.getState().spawnSword();

    expect(useGameStore.getState()).toMatchObject({
      swordActive: true,
      swordPositionIndex: 1,
    });

    useGameStore.getState().collectSword();

    expect(useGameStore.getState()).toMatchObject({
      activeClass: "Necromancer",
      isPowerOnCooldown: false,
      swordActive: false,
      screenMessage: "Nouvelle Classe : NECROMANCER !",
    });
    expect(useGameStore.getState().swordSpawnTimeoutId).not.toBeNull();

    vi.advanceTimersByTime(SWORD_SPAWN_TIMERS.respawn);
    expect(useGameStore.getState().swordActive).toBe(true);
  });

  it("applique les pouvoirs de classe avec leurs effets de gameplay", async () => {
    vi.useFakeTimers();

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);

    useGameStore.getState().debugSetClass("Warrior");
    useGameStore.getState().useClassPower();
    expect(useGameStore.getState().warriorImpulseTrigger).toBe(1);
    expect(useGameStore.getState().isPowerOnCooldown).toBe(true);

    // Le cooldown bloque une seconde activation immédiate.
    useGameStore.getState().useClassPower();
    expect(useGameStore.getState().warriorImpulseTrigger).toBe(1);

    vi.advanceTimersByTime(CLASS_COOLDOWNS.Warrior);
    expect(useGameStore.getState().isPowerOnCooldown).toBe(false);

    useGameStore.getState().debugSetClass("Dwarf");
    useGameStore.getState().useClassPower();
    expect(useGameStore.getState().mineHits).toBe(3);
    expect(useGameStore.getState().activeMultipliers.dwarfMultiplier).toMatchObject({
      value: MULTIPLIERS_CONFIG.dwarfMultiplier.value,
      totalDuration: MULTIPLIERS_CONFIG.dwarfMultiplier.durationMs,
    });

    useGameStore.getState().debugSetClass("Necromancer");
    useGameStore.getState().useClassPower();
    expect(useGameStore.getState().activeBalls.at(-1)).toMatchObject({
      origin: "cannon",
    });
  });

  it("active un multiplicateur libre avec le pouvoir elfe", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);
    useGameStore.getState().debugSetClass("Elf");

    useGameStore.getState().useClassPower();

    const firstElfTarget = ELF_POWER_CONFIG.possibleTargets[0];
    expect(useGameStore.getState().activeMultipliers[firstElfTarget]).toMatchObject({
      value: MULTIPLIERS_CONFIG[firstElfTarget].value,
    });
    expect(useGameStore.getState().screenMessage).toBe(
      `Pouvoir Elfe : Bonus ${firstElfTarget.toUpperCase()} activé !`,
    );
  });

  it("n'applique pas le pouvoir elfe quand tous ses bonus sont déjà actifs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);
    useGameStore.getState().debugSetClass("Elf");

    useGameStore.setState({
      activeMultipliers: Object.fromEntries(
        ELF_POWER_CONFIG.possibleTargets.map((source) => [
          source,
          {
            value: MULTIPLIERS_CONFIG[source].value,
            expiresAt: Date.now() + 10_000,
            totalDuration: 10_000,
          },
        ]),
      ),
    });

    useGameStore.getState().useClassPower();

    expect(useGameStore.getState().isPowerOnCooldown).toBe(false);
    expect(useGameStore.getState().screenMessage).toBe(
      "Pouvoir Elfe : Tous les bonus sont déjà actifs !",
    );
  });

  it("cumule score de zone, classe active et multiplicateur global", async () => {
    vi.useFakeTimers();

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);
    useGameStore.getState().debugSetClass("Warrior");
    useGameStore.getState().activateMultiplier("lightRoad", 3, 1_000);
    useGameStore.getState().addZoneScore(100, "Bumpers");

    expect(useGameStore.getState().scores).toEqual([600]);

    vi.advanceTimersByTime(1_001);
    expect(useGameStore.getState().getCurrentMultiplier()).toBe(1);
  });

  it("déclenche le bonus soleil quand tous les multiplicateurs requis sont actifs", async () => {
    vi.useFakeTimers();

    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);
    useGameStore.getState().setBallInLauncher(false);

    for (const source of SUN_BONUS_REQUIRED_SOURCES) {
      useGameStore.getState().activateMultiplier(source, undefined, 10_000);
    }

    expect(useGameStore.getState().isUndeathActive).toBe(true);
    expect(useGameStore.getState().activeMultipliers.sunBonus).toMatchObject({
      value: MULTIPLIERS_CONFIG.sunBonus.value,
      totalDuration: MULTIPLIERS_CONFIG.sunBonus.durationMs,
    });
    expect(useGameStore.getState().getCurrentMultiplier()).toBe(50);

    // Tant que le bonus est déjà actif, un nouveau check ne doit pas relancer
    // une seconde boucle de bonus soleil.
    useGameStore.getState().checkSunBonus();

    vi.advanceTimersByTime(MULTIPLIERS_CONFIG.sunBonus.durationMs);
    expect(useGameStore.getState().isUndeathActive).toBe(false);

    useGameStore.getState().resetMultipliers();
    expect(useGameStore.getState().activeMultipliers).toEqual({});
  });

  it("garde le tour actif quand une seule bille de multiball est perdue", async () => {
    const { useGameStore } = await importFreshGameStore();
    resetGameState(useGameStore);

    useGameStore.getState().startGame(1);
    useGameStore.setState({
      activeBalls: [
        { id: "main_ball", origin: "launcher" },
        { id: "bonus_ball", origin: "cannon" },
      ],
      ballsRemaining: [3],
      isPlaying: true,
    });

    useGameStore.getState().loseBall("bonus_ball");
    expect(useGameStore.getState()).toMatchObject({
      activeBalls: [{ id: "main_ball", origin: "launcher" }],
      ballsRemaining: [3],
      isPlaying: true,
    });
  });
});
