import { type StateCreator } from "zustand";
import {
  getSyncedGameState,
  type GameState,
  syncState,
} from "../gameStore.types";

export type BallOrigin = "launcher" | "cannon";

export interface ActiveBall {
  id: string;
  origin: BallOrigin;
}
export interface CoreSlice {
  isPlaying: boolean;
  ballInLauncher: boolean;
  screenMessage: string | null;
  activeBalls: ActiveBall[]; // Registre des billes en jeu

  startGame: (players?: number) => void;
  loseBall: (ballId?: string) => void; // Prend l'ID de la bille perdue
  gameOver: () => void;
  setBallInLauncher: (inLauncher: boolean) => void;
  displayMessage: (message: string, durationInMs?: number) => void;
  addBall: (origin: BallOrigin) => void;
}

let messageTimeoutId: NodeJS.Timeout | null = null;
let nextBallId = 0; // Pour générer des IDs uniques

export const createCoreSlice: StateCreator<GameState, [], [], CoreSlice> = (
  set,
  get,
) => {
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    // Les fenêtres secondaires reçoivent un état complet pour éviter les
    // désynchronisations entre score, joueur actif, billes et messages DMD.
    syncState(getSyncedGameState(get()));
  };

  return {
    isPlaying: false,
    ballInLauncher: true,
    screenMessage: null,
    activeBalls: [{ id: `ball_${nextBallId}`, origin: "launcher" }],

    startGame: (players = 1) => {
      const initialScores = Array(players).fill(0);
      const initialBalls = Array(players).fill(3);

      setAndSync({
        playerCount: players,
        currentPlayerIndex: 0,
        scores: initialScores,
        ballsRemaining: initialBalls,
        isPlaying: true,
        ballInLauncher: true,
        scoreMultiplier: 1,
        mineHits: 0,
        rubiesActive: [false, false, false],
        leftKickbackActive: true,
        rightKickbackActive: true,
      });
      get().resetMultipliers();
      get().resetClassSystem();
      console.log(`Début de la partie à ${players} joueur(s) !`);
    },

    setBallInLauncher: (inLauncher) =>
      setAndSync({ ballInLauncher: inLauncher }),

    addBall: (origin) => {
      nextBallId += 1;
      const newBall: ActiveBall = { id: `ball_${nextBallId}`, origin };
      setAndSync({ activeBalls: [...get().activeBalls, newBall] });
      console.log(`Nouvelle bille ajoutée depuis: ${origin}`);
    },

    loseBall: (ballId?: string) => {
      const state = get();
      const lostBallId = ballId ?? state.activeBalls[0]?.id;

      if (!lostBallId) {
        return;
      }

      // Retire la bille perdue du registre
      const remainingBallsOnPlayfield = state.activeBalls.filter(
        (b) => b.id !== lostBallId,
      );

      // Si c'était un Multiball et qu'il reste d'autres billes, le tour continue
      if (remainingBallsOnPlayfield.length > 0) {
        setAndSync({ activeBalls: remainingBallsOnPlayfield });
        console.log(`Bille ${lostBallId} perdue, mais le Multiball continue !`);
        return;
      }

      // LOGIQUE DE PERTE DE TOUR (Il n'y a plus aucune bille en jeu)
      const newBallsRemaining = [...state.ballsRemaining];
      newBallsRemaining[state.currentPlayerIndex] -= 1;

      const isGameOver = newBallsRemaining.every((balls) => balls <= 0);

      if (isGameOver) {
        nextBallId += 1;
        setAndSync({
          ballsRemaining: newBallsRemaining,
          // On prépare la bille de la prochaine partie (anti-crash)
          activeBalls: [{ id: `ball_${nextBallId}`, origin: "launcher" }],
        });
        get().gameOver();
        return;
      }

      let nextPlayer = (state.currentPlayerIndex + 1) % state.playerCount;
      while (newBallsRemaining[nextPlayer] <= 0) {
        nextPlayer = (nextPlayer + 1) % state.playerCount;
      }

      nextBallId += 1;
      const nextTurnBall: ActiveBall = {
        id: `ball_${nextBallId}`,
        origin: "launcher",
      };
      setAndSync({
        ballsRemaining: newBallsRemaining,
        currentPlayerIndex: nextPlayer,
        ballInLauncher: true,
        activeBalls: [nextTurnBall], // Prépare la bille du prochain joueur
        rubiesActive: [false, false, false],
        mineHits: 0,
        scoreMultiplier: 1,
        leftKickbackActive: true,
        rightKickbackActive: true,
      });
      get().resetMultipliers();
      get().resetClassSystem();
      console.log(
        `Toutes les billes perdues. Au tour du Joueur ${nextPlayer + 1} !`,
      );
    },

    gameOver: () => {
      console.log("Game Over !");
      setAndSync({ isPlaying: false });
    },

    displayMessage: (message, durationInMs = 2000) => {
      setAndSync({ screenMessage: message });

      if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
      }

      messageTimeoutId = setTimeout(() => {
        setAndSync({ screenMessage: null });
      }, durationInMs);
    },
  };
};
