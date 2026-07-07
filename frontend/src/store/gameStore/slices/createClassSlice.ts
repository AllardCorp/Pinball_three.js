import { type StateCreator } from "zustand";
import { type GameState } from "../gameStore.types";

import {
  type PlayerClass,
  type PlayfieldZone,
  CLASS_COOLDOWNS,
  CLASS_ZONE_SYNERGIES,
  PLAYABLE_CLASSES,
  CLASS_POWER_MESSAGES,
  ELF_POWER_CONFIG,
  SWORD_POSITIONS,
  SWORD_SPAWN_TIMERS,
  MAX_BALLS,
} from "@/config/gameBalancingConfig";

// ----------------------------------------------------------------------
// DICTIONNAIRE DES STRATÉGIES (Polymorphisme)
// ----------------------------------------------------------------------
// Chaque classe possède sa propre logique isolée.
// La fonction retourne 'false' si les conditions d'activation ne sont pas remplies (pour annuler le cooldown).
type PowerStrategy = (
  get: () => GameState,
  set: (state: Partial<GameState>) => void,
) => boolean | void;

const CLASS_POWER_STRATEGIES: Record<
  Exclude<PlayerClass, "None">,
  PowerStrategy
> = {
  Elf: (get) => {
    const state = get();
    const inactiveOnes = ELF_POWER_CONFIG.possibleTargets.filter(
      (m) =>
        !state.activeMultipliers[m] ||
        state.activeMultipliers[m].expiresAt <= Date.now(),
    );

    if (inactiveOnes.length > 0) {
      const randomMult =
        inactiveOnes[Math.floor(Math.random() * inactiveOnes.length)];
      get().activateMultiplier(randomMult);
      get().displayMessage(
        `Pouvoir Elfe : Bonus ${randomMult.toUpperCase()} activé !`,
        3000,
      );
    } else {
      get().displayMessage(
        "Pouvoir Elfe : Tous les bonus sont déjà actifs !",
        3000,
      );
      return false;
    }
  },

  Necromancer: (get) => {
    if (get().activeBalls.length < MAX_BALLS && !get().ballInLauncher) {
      get().addBall("cannon");
      get().displayMessage("💀 ÉVEIL DES MORTS !", 3000);
    } else {
      return false;
    }
  },

  Warrior: (get, set) => {
    set({ warriorImpulseTrigger: get().warriorImpulseTrigger + 1 });
  },

  Dwarf: (get) => {
    get().activateMultiplier("dwarfMultiplier");
    get().setMineHits(3);
    get().displayMessage("Pouvoir du nain", 3000);
  },
};

// ----------------------------------------------------------------------
// DÉFINITION DE LA SLICE
// ----------------------------------------------------------------------
export interface ClassSlice {
  activeClass: PlayerClass;
  isPowerOnCooldown: boolean;
  powerCooldownExpiresAt: number;
  powerCooldownTotalDuration: number;
  swordActive: boolean;
  swordPositionIndex: number;
  swordSpawnTimeoutId: NodeJS.Timeout | null;
  warriorImpulseTrigger: number;

  // Actions
  spawnSword: () => void;
  collectSword: () => void;
  scheduleSwordSpawn: (delay: number) => void;
  useClassPower: () => void;
  resetClassSystem: () => void;
  debugSetClass: (className: PlayerClass) => void;
  getClassZoneMultiplier: (zone: PlayfieldZone) => number;
}

export const createClassSlice: StateCreator<GameState, [], [], ClassSlice> = (
  set,
  get,
) => {
  return {
    activeClass: "None",
    isPowerOnCooldown: false,
    powerCooldownExpiresAt: 0,
    powerCooldownTotalDuration: 0,
    swordActive: false,
    swordPositionIndex: 0,
    swordSpawnTimeoutId: null,
    warriorImpulseTrigger: 0,

    spawnSword: () => {
      if (!get().isPlaying) return;

      if (!get().swordActive) {
        const currentIndex = get().swordPositionIndex;
        const availableIndices = SWORD_POSITIONS.map(
          (_, index) => index,
        ).filter((index) => index !== currentIndex);

        const randomPosIndex =
          availableIndices[Math.floor(Math.random() * availableIndices.length)];

        set({
          swordActive: true,
          swordPositionIndex: randomPosIndex,
          swordSpawnTimeoutId: null,
        });

        get().displayMessage("Une épée est apparue sur le plateau !", 3000);
      }
    },

    scheduleSwordSpawn: (delay) => {
      if (get().swordSpawnTimeoutId) {
        clearTimeout(get().swordSpawnTimeoutId!);
      }

      console.log(`L'épée apparaîtra dans ${delay / 1000} secondes.`);

      const timeoutId = setTimeout(() => {
        get().spawnSword();
      }, delay);

      set({ swordSpawnTimeoutId: timeoutId });
    },

    collectSword: () => {
      if (!get().isPlaying || !get().swordActive) return;

      const currentClass = get().activeClass;
      const availableClasses = PLAYABLE_CLASSES.filter(
        (c) => c !== currentClass,
      );
      const randomClass =
        availableClasses[Math.floor(Math.random() * availableClasses.length)];

      set({
        activeClass: randomClass,
        swordActive: false,
        isPowerOnCooldown: false,
        powerCooldownExpiresAt: 0,
        powerCooldownTotalDuration: 0,
      });

      get().displayMessage(
        `Nouvelle Classe : ${randomClass.toUpperCase()} !`,
        4000,
      );

      get().scheduleSwordSpawn(SWORD_SPAWN_TIMERS.respawn);
    },

    useClassPower: () => {
      const state = get();

      // 1. Clauses de garde
      if (
        !state.isPlaying ||
        state.activeClass === "None" ||
        state.isPowerOnCooldown ||
        state.ballInLauncher
      ) {
        return;
      }

      // 2. Sélection de la stratégie
      const executeStrategy = CLASS_POWER_STRATEGIES[state.activeClass];
      if (!executeStrategy) return;

      console.log(`Activation du pouvoir : ${state.activeClass}`);

      // 3. Exécution polymorphique
      const executionResult = executeStrategy(get, set);

      // Si la compétence ne peut pas s'activer (ex: table pleine pour le Necromancien), on annule le cooldown
      if (executionResult === false) return;

      // 4. Gestion du Cooldown (Logique commune)
      const cooldownDuration = CLASS_COOLDOWNS[state.activeClass];
      get().displayMessage(CLASS_POWER_MESSAGES[state.activeClass], 3000);

      set({
        isPowerOnCooldown: true,
        powerCooldownExpiresAt: Date.now() + cooldownDuration,
        powerCooldownTotalDuration: cooldownDuration,
      });

      setTimeout(() => {
        set({ isPowerOnCooldown: false });
      }, cooldownDuration);
    },

    getClassZoneMultiplier: (zone) => {
      const currentClass = get().activeClass;
      return CLASS_ZONE_SYNERGIES[currentClass]?.[zone] || 1;
    },

    resetClassSystem: () => {
      if (get().swordSpawnTimeoutId) {
        clearTimeout(get().swordSpawnTimeoutId!);
      }

      set({
        activeClass: "None",
        isPowerOnCooldown: false,
        powerCooldownExpiresAt: 0,
        powerCooldownTotalDuration: 0,
        swordActive: false,
        warriorImpulseTrigger: 0,
      });
    },

    debugSetClass: (className) => {
      set({
        activeClass: className,
        isPowerOnCooldown: false,
        powerCooldownExpiresAt: 0,
        powerCooldownTotalDuration: 0,
        swordActive: false,
      });
      get().displayMessage(`[DEBUG] Classe forcée : ${className}`, 2000);
    },
  };
};
