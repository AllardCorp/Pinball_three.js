import { type StateCreator } from "zustand";
import { type GameState } from "../gameStore.types";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

export interface PlayfieldSlice {
  mineHits: number;
  rubiesActive: [boolean, boolean, boolean];
  leftKickbackActive: boolean;
  rightKickbackActive: boolean;
  useKickback: (side: "left" | "right") => void;
  incrementMine: () => void;
  setMineHits: (hits: number) => void;
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
  return {
    mineHits: 0,
    rubiesActive: [false, false, false],
    leftKickbackActive: true,
    rightKickbackActive: true,

    incrementMine: () => {
      const currentHits = get().mineHits;
      if (currentHits < 3) {
        set({ mineHits: currentHits + 1 });
      }
    },
    setMineHits: (hits: number) => {
      set({ mineHits: hits });
    },

    resetMine: () => {
      set({ mineHits: 0 });
    },

    toggleRuby: (id) => {
      const currentRubies = [...get().rubiesActive] as [
        boolean,
        boolean,
        boolean,
      ];
      currentRubies[id] = !currentRubies[id];

      set({ rubiesActive: currentRubies });

      if (currentRubies.every((ruby) => ruby === true)) {
        get().addScore(SCORE_VALUES.gemsToggle);
        get().activateMultiplier("gems");
        set({ rubiesActive: [false, false, false] });
        console.log("Tous les rubis activés");
      }
    },

    useKickback: (side) => {
      if (side === "left") set({ leftKickbackActive: false });
      if (side === "right") set({ rightKickbackActive: false });
    },
  };
};
