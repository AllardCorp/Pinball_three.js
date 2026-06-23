import { type StateCreator } from "zustand";
import { type GameState, syncState } from "../gameStore.types";
export interface CoreSlice {
  isPlaying: boolean;
  ballInLauncher: boolean;
  screenMessage: string | null;
  startGame: (players?: number) => void;
  loseBall: () => void;
  gameOver: () => void;
  setBallInLauncher: (inLauncher: boolean) => void;
  displayMessage: (message: string, durationInMs?: number) => void;
}

let messageTimeoutId: NodeJS.Timeout | null = null;

// Gère le cycle de vie de la partie (Démarrer, Game Over, Perdre une bille).
export const createCoreSlice: StateCreator<GameState, [], [], CoreSlice> = (
  set,
  get,
) => {
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    syncState(newState);
  };

  return {
    isPlaying: false,
    ballInLauncher: true,
    screenMessage: null,

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

      console.log(`Début de la partie à ${players} joueur(s) !`);
    },

    setBallInLauncher: (inLauncher) =>
      setAndSync({ ballInLauncher: inLauncher }),

    loseBall: () => {
      const state = get();
      const newBallsRemaining = [...state.ballsRemaining];

      newBallsRemaining[state.currentPlayerIndex] -= 1;

      const isGameOver = newBallsRemaining.every((balls) => balls <= 0);

      if (isGameOver) {
        setAndSync({ ballsRemaining: newBallsRemaining });
        get().gameOver();
        return;
      }

      let nextPlayer = (state.currentPlayerIndex + 1) % state.playerCount;
      while (newBallsRemaining[nextPlayer] <= 0) {
        nextPlayer = (nextPlayer + 1) % state.playerCount;
      }

      setAndSync({
        ballsRemaining: newBallsRemaining,
        currentPlayerIndex: nextPlayer,
        ballInLauncher: true,
        rubiesActive: [false, false, false],
        mineHits: 0,
        scoreMultiplier: 1,
        leftKickbackActive: true,
        rightKickbackActive: true,
      });

      console.log(`Bille perdue. Au tour du Joueur ${nextPlayer + 1} !`);
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
