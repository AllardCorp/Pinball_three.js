import { type StateCreator } from "zustand";
import { type GameState, syncState } from "../gameStore.types";
import {
  type MultiplierSource,
  MULTIPLIERS_CONFIG,
  SUN_BONUS_REQUIRED_SOURCES,
  CLASS_MULTIPLIER_OVERRIDES,
} from "@/config/gameBalancingConfig";

export interface MultiplierSlice {
  activeMultipliers: Record<
    string,
    { value: number; expiresAt: number; totalDuration: number }
  >;
  isUndeathActive: boolean;
  activateMultiplier: (
    source: MultiplierSource,
    customValue?: number,
    customDurationMs?: number,
  ) => void;
  getCurrentMultiplier: () => number;
  checkSunBonus: () => void;
  resetMultipliers: () => void;
}

export const createMultiplierSlice: StateCreator<
  GameState,
  [],
  [],
  MultiplierSlice
> = (set, get) => {
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    syncState(newState);
  };

  return {
    activeMultipliers: {},
    isUndeathActive: false,

    activateMultiplier: (source, customValue, customDurationMs) => {
      if (!get().isPlaying) return;

      const now = Date.now();
      const currentClass = get().activeClass;

      // Vérifie si la configuration accorde un passe-droit à cette classe pour cette source
      const overrideValue = CLASS_MULTIPLIER_OVERRIDES[currentClass]?.[source];

      // L'ordre de priorité :
      // 1. Valeur forcée manuellement (customValue)
      // 2. Surcharge de classe (overrideValue - ex: le x12 du Nain)
      // 3. Valeur de base (MULTIPLIERS_CONFIG - ex: le x8 normal)
      const finalValue =
        customValue ?? overrideValue ?? MULTIPLIERS_CONFIG[source].value;

      const finalDuration =
        customDurationMs ?? MULTIPLIERS_CONFIG[source].durationMs;

      const newMultipliers = {
        ...get().activeMultipliers,
        [source]: {
          value: finalValue,
          expiresAt: now + finalDuration,
          totalDuration: finalDuration,
        },
      };

      setAndSync({ activeMultipliers: newMultipliers });
      get().checkSunBonus();
    },

    getCurrentMultiplier: () => {
      const now = Date.now();
      const multipliers = get().activeMultipliers;
      let maxMult = 1;

      for (const key in multipliers) {
        if (multipliers[key].expiresAt > now) {
          if (multipliers[key].value > maxMult) {
            maxMult = multipliers[key].value;
          }
        }
      }
      return maxMult;
    },

    checkSunBonus: () => {
      const now = Date.now();
      const multipliers = get().activeMultipliers;

      const allActive = SUN_BONUS_REQUIRED_SOURCES.every(
        (source) => multipliers[source] && multipliers[source].expiresAt > now,
      );

      if (allActive && !get().isUndeathActive) {
        console.log("🌞 CONDITIONS DU SUN BONUS REMPLIES ! 🌞");

        // Le store connaît déjà les valeurs du sunBonus via la config
        get().activateMultiplier("sunBonus");

        setAndSync({ isUndeathActive: true });
        get().displayMessage("🌞 SUN BONUS ACTIVÉ ! x50 + UNDEATH 🌞", 4000);

        setTimeout(() => {
          setAndSync({ isUndeathActive: false });
          get().displayMessage("Le pouvoir du Soleil s'estompe...", 2000);
        }, MULTIPLIERS_CONFIG["sunBonus"].durationMs);
      }
    },

    resetMultipliers: () => {
      setAndSync({
        activeMultipliers: {},
        isUndeathActive: false,
      });
    },
  };
};
