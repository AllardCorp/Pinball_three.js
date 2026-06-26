import { type StateCreator } from "zustand";
import { type GameState, syncState } from "../gameStore.types";
import { type PlayfieldZone } from "@/config/gameBalancingConfig";

export interface PlayerSlice {
  playerCount: number;
  currentPlayerIndex: number;
  scores: number[];
  ballsRemaining: number[];
  addScore: (points: number) => void;
  addZoneScore: (basePoints: number, zone: PlayfieldZone) => void;
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
        // Calcule le multiplicateur dynamique à l'instant T
        const currentMultiplier = get().getCurrentMultiplier();

        newScores[get().currentPlayerIndex] += points * currentMultiplier;
        setAndSync({ scores: newScores });
      }
    },
    addZoneScore: (basePoints, zone) => {
      if (!get().isPlaying) return;

      // 1. On récupère le bonus de la classe active (ex: x3 pour Nécro dans Fakir)
      const classBonus = get().getClassZoneMultiplier(zone);

      // 2. On récupère le multiplicateur global (ex: x10 si sortie Fakir Hard activée)
      const globalMultiplier = get().getCurrentMultiplier();

      // 3. On calcule le total
      // Ex : 100 (base) * 3 (Nécro) * 10 (Global) = 3000 points !
      const finalPoints = basePoints * classBonus * globalMultiplier;

      const newScores = [...get().scores];
      newScores[get().currentPlayerIndex] += finalPoints;

      setAndSync({ scores: newScores });
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
