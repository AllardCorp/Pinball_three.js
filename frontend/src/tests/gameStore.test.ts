import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { useGameStore } from "../store/gameStore/useGameStore";

// Snapshot de l'état initial du store (actions comprises), pris une seule fois
// au chargement du module, pour pouvoir reinitialiser le store avant chaque test.
const initialState = useGameStore.getState();

beforeEach(() => {
  useGameStore.setState(initialState, true);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("gameStore - Lancement de partie", () => {
  it("startGame initialise l'etat pour le nombre de joueurs demande", () => {
    useGameStore.getState().startGame(2);
    const state = useGameStore.getState();

    expect(state.isPlaying).toBe(true);
    expect(state.playerCount).toBe(2);
    expect(state.scores).toEqual([0, 0]);
    expect(state.ballsRemaining).toEqual([3, 3]);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.ballInLauncher).toBe(true);
    expect(state.mineHits).toBe(0);
    expect(state.rubiesActive).toEqual([false, false, false]);
    expect(state.leftKickbackActive).toBe(true);
    expect(state.rightKickbackActive).toBe(true);
  });

  it("startGame demarre une partie a un joueur par defaut", () => {
    useGameStore.getState().startGame();

    expect(useGameStore.getState().playerCount).toBe(1);
    expect(useGameStore.getState().scores).toEqual([0]);
  });
  
  it("startGame reinitialise les multiplicateurs et la classe actifs d'une partie precedente", () => {
    useGameStore.getState().startGame(1);
    useGameStore.getState().activateMultiplier("lightRoad");
    useGameStore.getState().debugSetClass("Warrior");

    useGameStore.getState().startGame(1);

    expect(useGameStore.getState().activeMultipliers).toEqual({});
    expect(useGameStore.getState().activeClass).toBe("None");
  });

  it("loseBall retire uniquement la bille perdue tant qu'un multiball est actif", () => {
    useGameStore.getState().startGame(1);
    useGameStore.getState().addBall("cannon");
    const [firstBall] = useGameStore.getState().activeBalls;

    useGameStore.getState().loseBall(firstBall.id);

    const state = useGameStore.getState();
    expect(state.activeBalls).toHaveLength(1);
    expect(state.ballsRemaining).toEqual([3]);
    expect(state.isPlaying).toBe(true);
  });

  it("loseBall decremente les balles et passe au joueur suivant quand plus aucune bille n'est en jeu", () => {
    useGameStore.getState().startGame(2);
    const [ball] = useGameStore.getState().activeBalls;

    useGameStore.getState().loseBall(ball.id);

    const state = useGameStore.getState();
    expect(state.ballsRemaining).toEqual([2, 3]);
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.ballInLauncher).toBe(true);
    expect(state.activeBalls).toHaveLength(1);
  });

  it("loseBall saute les joueurs qui n'ont plus de balles disponibles", () => {
    useGameStore.getState().startGame(3);
    useGameStore.setState({ ballsRemaining: [3, 0, 3] });
    const [ball] = useGameStore.getState().activeBalls;

    useGameStore.getState().loseBall(ball.id);

    expect(useGameStore.getState().currentPlayerIndex).toBe(2);
  });

  it("loseBall declenche gameOver quand tous les joueurs n'ont plus de balles", () => {
    useGameStore.getState().startGame(1);
    useGameStore.setState({ ballsRemaining: [1] });
    const [ball] = useGameStore.getState().activeBalls;

    useGameStore.getState().loseBall(ball.id);

    const state = useGameStore.getState();
    expect(state.ballsRemaining).toEqual([0]);
    expect(state.isPlaying).toBe(false);
  });

  it("displayMessage affiche un message puis l'efface automatiquement apres le delai", () => {
    vi.useFakeTimers();

    useGameStore.getState().displayMessage("Bienvenue", 2000);
    expect(useGameStore.getState().screenMessage).toBe("Bienvenue");

    vi.advanceTimersByTime(2000);
    expect(useGameStore.getState().screenMessage).toBeNull();
  });

  it("displayMessage relance le delai si un nouveau message arrive avant la fin du precedent", () => {
    vi.useFakeTimers();

    useGameStore.getState().displayMessage("Premier", 2000);
    vi.advanceTimersByTime(1000);
    useGameStore.getState().displayMessage("Second", 2000);
    vi.advanceTimersByTime(1000);

    // Le timer du "Premier" message aurait du expirer ici s'il n'avait pas ete annule
    expect(useGameStore.getState().screenMessage).toBe("Second");

    vi.advanceTimersByTime(1000);
    expect(useGameStore.getState().screenMessage).toBeNull();
  });
});

describe("gameStore - Incrementation de score", () => {
  it("addScore ne fait rien si la partie n'est pas en cours", () => {
    useGameStore.getState().addScore(100);

    expect(useGameStore.getState().scores).toEqual([0]);
  });

  it("addScore applique le multiplicateur actif courant", () => {
    useGameStore.getState().startGame(1);
    useGameStore.getState().activateMultiplier("lightRoad"); // x2

    useGameStore.getState().addScore(100);

    expect(useGameStore.getState().scores).toEqual([200]);
  });

  it("addScore credite le joueur actuellement actif, pas toujours le premier", () => {
    useGameStore.getState().startGame(2);
    useGameStore.setState({ currentPlayerIndex: 1 });

    useGameStore.getState().addScore(50);

    expect(useGameStore.getState().scores).toEqual([0, 50]);
  });

  it("addZoneScore combine le bonus de classe et le multiplicateur global", () => {
    useGameStore.getState().startGame(1);
    useGameStore.getState().debugSetClass("Necromancer"); // x3 sur la zone Fakir
    useGameStore.getState().activateMultiplier("lightRoad", 10); // multiplicateur global force a x10

    useGameStore.getState().addZoneScore(100, "Fakir");

    // 100 (base) * 3 (bonus classe) * 10 (multiplicateur global) = 3000
    expect(useGameStore.getState().scores).toEqual([3000]);
  });

  it("addZoneScore ne fait rien si la partie n'est pas en cours", () => {
    useGameStore.getState().addZoneScore(100, "Fakir");

    expect(useGameStore.getState().scores).toEqual([0]);
  });
});

describe("gameStore - Gestion des multiplicateurs", () => {
  it("getCurrentMultiplier retourne 1 quand aucun multiplicateur n'est actif", () => {
    expect(useGameStore.getState().getCurrentMultiplier()).toBe(1);
  });

  it("activateMultiplier est ignore si la partie n'est pas en cours", () => {
    useGameStore.getState().activateMultiplier("lightRoad");

    expect(useGameStore.getState().activeMultipliers).toEqual({});
    expect(useGameStore.getState().getCurrentMultiplier()).toBe(1);
  });

  it("getCurrentMultiplier retourne le plus eleve des multiplicateurs actifs", () => {
    useGameStore.getState().startGame(1);
    useGameStore.getState().activateMultiplier("lightRoad"); // x2
    useGameStore.getState().activateMultiplier("fakir"); // x4

    expect(useGameStore.getState().getCurrentMultiplier()).toBe(4);
  });

  it("un multiplicateur expire n'est plus pris en compte", () => {
    vi.useFakeTimers();
    useGameStore.getState().startGame(1);
    useGameStore.getState().activateMultiplier("lightRoad", undefined, 5000); // x2 pendant 5s

    expect(useGameStore.getState().getCurrentMultiplier()).toBe(2);

    vi.advanceTimersByTime(5001);

    expect(useGameStore.getState().getCurrentMultiplier()).toBe(1);
  });

  it("checkSunBonus ne s'active que lorsque toutes les sources requises sont actives en meme temps", () => {
    vi.useFakeTimers();
    useGameStore.getState().startGame(1);

    useGameStore.getState().activateMultiplier("lightRoad");
    useGameStore.getState().activateMultiplier("fakir");
    useGameStore.getState().activateMultiplier("rampHabitRight");
    expect(useGameStore.getState().isUndeathActive).toBe(false);

    useGameStore.getState().activateMultiplier("rampHabitLeft");
    useGameStore.getState().activateMultiplier("gems"); // 5e et derniere source requise

    expect(useGameStore.getState().isUndeathActive).toBe(true);
    expect(useGameStore.getState().activeMultipliers.sunBonus).toBeDefined();
  });

  it("resetMultipliers vide les multiplicateurs actifs et l'etat Undeath", () => {
    useGameStore.getState().startGame(1);
    useGameStore.getState().activateMultiplier("lightRoad");

    useGameStore.getState().resetMultipliers();

    expect(useGameStore.getState().activeMultipliers).toEqual({});
    expect(useGameStore.getState().isUndeathActive).toBe(false);
  });
});
