import { type StateCreator } from "zustand";
import {
  getSyncedGameState,
  type GameState,
  syncState,
} from "../gameStore.types";

export interface PlayfieldSlice {
  scoreMultiplier: number;
  mineHits: number;
  rubiesActive: [boolean, boolean, boolean];
  leftKickbackActive: boolean;
  rightKickbackActive: boolean;
  useKickback: (side: "left" | "right") => void;
  addScoreMultiplier: () => void;
  removeScoreMultiplier: () => void;
  incrementMine: () => void;
  resetMine: () => void;
  toggleRuby: (id: 0 | 1 | 2) => void;
}
// Gère la logique physique et les objectifs du plateau (rubis, mine, kickbacks, multiplicateurs).
export const createPlayfieldSlice: StateCreator<
  GameState,
  [],
  [],
  PlayfieldSlice
> = (set, get) => {
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    // Les objectifs du plateau ont un impact direct sur les écrans cabinet :
    // on propage donc l'état complet plutôt qu'un fragment isolé.
    syncState(getSyncedGameState(get()));
  };

  return {
    scoreMultiplier: 1,
    mineHits: 0,
    rubiesActive: [false, false, false],
    leftKickbackActive: true,
    rightKickbackActive: true,

    addScoreMultiplier: () => {
      if (get().isPlaying) {
        setAndSync({
          scoreMultiplier: Math.min(10, get().scoreMultiplier + 1),
        });
      }
    },

    removeScoreMultiplier: () => {
      if (get().isPlaying) {
        setAndSync({ scoreMultiplier: Math.max(1, get().scoreMultiplier - 1) });
      }
    },

    incrementMine: () => {
      const currentHits = get().mineHits;
      if (currentHits < 3) {
        setAndSync({ mineHits: currentHits + 1 });
      }
    },

    resetMine: () => {
      setAndSync({ mineHits: 0 });
    },

    toggleRuby: (id) => {
      const currentRubies = [...get().rubiesActive] as [
        boolean,
        boolean,
        boolean,
      ];
      currentRubies[id] = !currentRubies[id];

      setAndSync({ rubiesActive: currentRubies });

      if (currentRubies.every((ruby) => ruby === true)) {
        get().addScore(5000);

        // Les rubis sont réinitialisés juste après le bonus pour le gameplay.
        // Sans message transitoire, le DMD reçoit un état trop bref pour
        // afficher l'animation. Ce message sert donc de signal d'affichage,
        // sans changer la logique de collision ou de score.
        get().displayMessage("TROIS RUBIS - 5000", 3500);

        setAndSync({ rubiesActive: [false, false, false] });
        console.log("Tous les rubis activés + 5000");
      }
    },

    useKickback: (side) => {
      if (side === "left") setAndSync({ leftKickbackActive: false });
      if (side === "right") setAndSync({ rightKickbackActive: false });
    },
  };
};
