import { type StateCreator } from "zustand";
import { type GameState, syncState } from "../gameStore.types";

export interface PlayerSlice {
  playerCount: number;
  currentPlayerIndex: number;
  scores: number[];
  ballsRemaining: number[];
  addScore: (points: number) => void;
  removeScore: (points: number) => void;
}
// Gère la logique comptable (joueurs, scores, balles restantes) du jeu.
// Cette slice est responsable de la gestion des joueurs et de leurs scores dans le jeu.
// Elle fournit des méthodes pour ajouter ou retirer des points aux scores des joueurs, tout en s'assurant que les scores ne deviennent pas négatifs.
// Elle synchronise également l'état avec d'autres instances du jeu via un canal de diffusion (BroadcastChannel).
export const createPlayerSlice: StateCreator<GameState, [], [], PlayerSlice> = (
  set,
  get,
) => {
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    syncState(newState);
  };

  return {
    playerCount: 1,
    currentPlayerIndex: 0,
    scores: [0],
    ballsRemaining: [0],

    addScore: (points) => {
      if (get().isPlaying) {
        const newScores = [...get().scores];
        newScores[get().currentPlayerIndex] += points * get().scoreMultiplier;
        setAndSync({ scores: newScores });
      }
    },

    removeScore: (points) => {
      if (get().isPlaying) {
        const newScores = [...get().scores];
        newScores[get().currentPlayerIndex] = Math.max(
          0,
          newScores[get().currentPlayerIndex] - points,
        );
        setAndSync({ scores: newScores });
      }
    },
  };
};
