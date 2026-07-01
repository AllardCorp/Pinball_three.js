import { type StateCreator } from "zustand";
import {
  getSyncedGameState,
  type GameState,
  syncState,
} from "../gameStore.types";

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

export interface ClassSlice {
  activeClass: PlayerClass;
  isPowerOnCooldown: boolean;
  powerCooldownExpiresAt: number;
  powerCooldownTotalDuration: number;
  swordActive: boolean;
  swordPositionIndex: number; // Index de la position actuelle de l'épée dans SWORD_POSITIONS
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
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    // Les informations de classe impactent l'affichage cabinet, donc on
    // diffuse un snapshot stable plutot qu'un patch partiel.
    syncState(getSyncedGameState(get()));
  };

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
        // L'index de l'ancienne position
        const currentIndex = get().swordPositionIndex;

        // Liste tous les index possibles et exclut l'index actuel
        const availableIndices = SWORD_POSITIONS.map(
          (_, index) => index,
        ).filter((index) => index !== currentIndex);

        const randomPosIndex =
          availableIndices[Math.floor(Math.random() * availableIndices.length)];

        setAndSync({
          swordActive: true,
          swordPositionIndex: randomPosIndex,
          swordSpawnTimeoutId: null,
        });

        get().displayMessage("Une épée est apparue sur le plateau !", 3000);
      }
    },
    scheduleSwordSpawn: (delay) => {
      // Sécurité : si un timer est déjà en cours, on l'annule pour ne pas superposer
      if (get().swordSpawnTimeoutId) {
        clearTimeout(get().swordSpawnTimeoutId!);
      }

      console.log(`L'épée apparaîtra dans ${delay / 1000} secondes.`);

      const timeoutId = setTimeout(() => {
        get().spawnSword();
      }, delay);

      setAndSync({ swordSpawnTimeoutId: timeoutId });
    },
    collectSword: () => {
      if (!get().isPlaying || !get().swordActive) return;

      const currentClass = get().activeClass;

      const availableClasses = PLAYABLE_CLASSES.filter(
        (c) => c !== currentClass,
      );
      const randomClass =
        availableClasses[Math.floor(Math.random() * availableClasses.length)];

      setAndSync({
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
      // Lancer le timer pour le respawn
      get().scheduleSwordSpawn(SWORD_SPAWN_TIMERS.respawn);
    },
    useClassPower: () => {
      const state = get();

      if (
        !state.isPlaying ||
        state.activeClass === "None" ||
        state.isPowerOnCooldown ||
        state.ballInLauncher
      )
        return;

      console.log(`Activation du pouvoir : ${state.activeClass}`);

      // On récupère dynamiquement la durée depuis le dictionnaire
      const cooldownDuration = CLASS_COOLDOWNS[state.activeClass];
      get().displayMessage(CLASS_POWER_MESSAGES[state.activeClass], 3000);

      switch (state.activeClass) {
        case "Elf":
          // Utilisation du config de l'Elfe (ELF_POWER_CONFIG.possibleTargets)
          const inactiveOnes = ELF_POWER_CONFIG.possibleTargets.filter(
            (m) =>
              !state.activeMultipliers[m] ||
              state.activeMultipliers[m].expiresAt <= Date.now(),
          );

          if (inactiveOnes.length > 0) {
            const randomMult =
              inactiveOnes[Math.floor(Math.random() * inactiveOnes.length)];

            // Activation du multiplicateur choisi
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
            return;
          }
          break;
        case "Necromancer":
          const currentBalls = get().activeBalls.length;

          if (currentBalls < MAX_BALLS && !get().ballInLauncher) {
            get().addBall("cannon");
            get().displayMessage("💀 ÉVEIL DES MORTS !", 3000);
          } else {
            return; // Annule le cooldown si le pouvoir ne peut pas être utilisé
          }
          break;

        case "Warrior":
          // Incrémentation du trigger pour avertir le composant Ball
          setAndSync({
            warriorImpulseTrigger: state.warriorImpulseTrigger + 1,
          });
          break;

        case "Dwarf":
          get().activateMultiplier("dwarfMultiplier");
          get().setMineHits(3); // Retire les planches de la mine

          get().displayMessage("Pouvoir du nain", 3000);
          break;
      }

      setAndSync({
        isPowerOnCooldown: true,
        powerCooldownExpiresAt: Date.now() + cooldownDuration,
        powerCooldownTotalDuration: cooldownDuration,
      });

      setTimeout(() => {
        setAndSync({ isPowerOnCooldown: false });
      }, cooldownDuration);
    },

    getClassZoneMultiplier: (zone) => {
      const currentClass = get().activeClass;
      return CLASS_ZONE_SYNERGIES[currentClass]?.[zone] || 1;
    },

    resetClassSystem: () => {
      // Annule le timer de spawn de l'épée
      if (get().swordSpawnTimeoutId) {
        clearTimeout(get().swordSpawnTimeoutId!);
      }

      setAndSync({
        activeClass: "None",
        isPowerOnCooldown: false,
        powerCooldownExpiresAt: 0,
        powerCooldownTotalDuration: 0,
        swordActive: false,
        warriorImpulseTrigger: 0,
      });
    },

    debugSetClass: (className) => {
      setAndSync({
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
