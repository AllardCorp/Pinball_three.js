import { type StateCreator } from "zustand";
import { type GameState, syncState } from "../gameStore.types";
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
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    syncState(newState);
  };

  return {
    mineHits: 0,
    rubiesActive: [false, false, false],
    leftKickbackActive: true,
    rightKickbackActive: true,

    incrementMine: () => {
      const currentHits = get().mineHits;
      if (currentHits < 3) {
        setAndSync({ mineHits: currentHits + 1 });
      }
    },
    setMineHits: (hits: number) => {
      setAndSync({ mineHits: hits });
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
        get().addScore(SCORE_VALUES.gemsToggle);
        get().activateMultiplier("gems");
        setAndSync({ rubiesActive: [false, false, false] });
        console.log("Tous les rubis activés");
      }
    },

    useKickback: (side) => {
      if (side === "left") setAndSync({ leftKickbackActive: false });
      if (side === "right") setAndSync({ rightKickbackActive: false });
    },
  };
};
