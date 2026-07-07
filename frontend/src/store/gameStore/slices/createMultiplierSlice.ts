import { type StateCreator } from "zustand";
import { type GameState } from "../gameStore.types";
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
  return {
    activeMultipliers: {},
    isUndeathActive: false,

    activateMultiplier: (source, customValue, customDurationMs) => {
      if (!get().isPlaying) return;

      const now = Date.now();
      const currentClass = get().activeClass;

      const overrideValue = CLASS_MULTIPLIER_OVERRIDES[currentClass]?.[source];

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

      set({ activeMultipliers: newMultipliers });

      // Ne vérifie pas le Sun Bonus si on est déjà en train de l'activer pour éviter une récursion infinie
      if (source !== "sunBonus") {
        get().checkSunBonus();
      }
    },

    getCurrentMultiplier: () => {
      const now = Date.now();
      const multipliers = get().activeMultipliers;
      let maxMult = 1;

      // Récupère le multiplicateur le plus élevé parmi les multiplicateurs actifs
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
      // Si déjà actif, on return
      if (get().isUndeathActive) return;

      const now = Date.now();
      const multipliers = get().activeMultipliers;

      const allActive = SUN_BONUS_REQUIRED_SOURCES.every(
        (source) => multipliers[source] && multipliers[source].expiresAt > now,
      );

      if (allActive) {
        console.log("🌞 CONDITIONS DU SUN BONUS REMPLIES ! 🌞");

        // Passe à true AVANT d'activer le multiplicateur pour verrouiller l'état
        set({ isUndeathActive: true });

        get().activateMultiplier("sunBonus");
        get().displayMessage("🌞 SUN BONUS ACTIVÉ ! x50 + UNDEATH 🌞", 4000);

        setTimeout(() => {
          set({ isUndeathActive: false });
          get().displayMessage("Le pouvoir du Soleil s'estompe...", 2000);
        }, MULTIPLIERS_CONFIG["sunBonus"].durationMs);
      }
    },

    resetMultipliers: () => {
      set({
        activeMultipliers: {},
        isUndeathActive: false,
      });
    },
  };
};
