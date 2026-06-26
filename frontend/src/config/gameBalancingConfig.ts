// ==========================================
// CONFIGURATION & ÉQUILIBRAGE DU JEU
// ==========================================

// LES CLASSES
export type PlayerClass = "None" | "Necromancer" | "Dwarf" | "Warrior" | "Elf";

// Les zones du plateau
export type PlayfieldZone =
  | "Fakir"
  | "Mine"
  | "Bumpers"
  | "LightRoad"
  | "Neutral";

// Constantes pour les classes jouables
export const PLAYABLE_CLASSES: PlayerClass[] = [
  "Necromancer",
  "Dwarf",
  "Warrior",
  "Elf",
];
// Messages affichés lors de l'activation d'un pouvoir de classe
export const CLASS_POWER_MESSAGES: Record<PlayerClass, string> = {
  Necromancer: "Pouvoir Nécromancien : Les morts se lèvent !",
  Elf: "Pouvoir Elfe : Multiplicateur Surprise !",
  Warrior: "Pouvoir Guerrier : RAGE !",
  Dwarf: "Pouvoir Nain activé : Visez la mine !",
  None: "",
};

// Réglages spécifiques au pouvoir de l'Elfe
export const ELF_POWER_CONFIG = {
  multiplierValue: 4,
  durationMs: 15000,
  possibleTargets: [
    "lightRoad",
    "fakirSimple",
    "fakirMedium",
    "fakirHard",
    "mine",
    "gems",
  ] as const,
};

// Réglages spécifiques au pouvoir du guerrier
export const WARRIOR_POWER_CONFIG = {
  // Ajuste ces valeurs selon tes tests. y donne un petit saut, -z propulse vers le haut du plateau
  impulseForce: { x: 0, y: 0, z: -60 },
};

// Les synergies entre classes et zones
export const CLASS_ZONE_SYNERGIES: Record<
  string,
  Partial<Record<PlayfieldZone, number>>
> = {
  Necromancer: { Fakir: 3 },
  Dwarf: { Mine: 2 },
  Warrior: { Bumpers: 2 },
  Elf: { LightRoad: 2 },
  None: {},
};

// La durée de cooldown des pouvoirs de chaque classe (en millisecondes)
export const CLASS_COOLDOWNS: Record<PlayerClass, number> = {
  Necromancer: 60000,
  Elf: 20000,
  Warrior: 10000,
  Dwarf: 15000,
  None: 0,
};

// Les positions possibles pour l'apparition de l'épée [x, y, z]
export const SWORD_POSITIONS: [number, number, number][] = [
  [-9.5, -0.762, 3.6], // Entrée rampe de gauche
  [-10.5, -0.762, 8.5], // Entrée de la mine
  [-8.5, -0.762, 0.3], // Début courbe gauche
  [-1.54, -0.762, -19.43], // Caurbe haut
  [-5.8, -0.762, 19.5], // Slingshot gauche
  [3.9, -0.762, 19.5], // Slingshot droit
  [-11.6, -0.762, 20.2], // Guidance gauche
  [7.43, -0.762, 20.2], // Guidance droit
  [8.93, -0.762, 1.51], // Entrée Faquir 1
  [11.78, 0.408, -15.49], // Entrée Faquir 2
  [-1.54, -0.762, -8.96], // Entre bumper 1
  [-5.8, -0.762, -9.71], // Entre bumper 2
  [-2.81, -0.762, -11.95], // Entre bumper 3
  [-5.06, -0.762, 2.26], // Millieu gauche
  [-5.06, -0.762, 5.25], // Millieu gauche 2
  [4.66, -0.762, 5.25], // Millieu droit
  [-0.58, -0.762, 8.25], // Millieu Tornade
  [5.8, -0.762, -2.03], // Entrée égoût
  [7.0, 3.208, -18.45], // Début rampe du haut
  [-10.16, -0.762, 12.71], // Bas gauche
  [7.04, -0.762, 12.71], // Bas droit
];
// Timer de spawn de l'épée
export const SWORD_SPAWN_TIMERS = {
  initial: 10000, // 20s après le lancement de la bille
  respawn: 30000, // 30s après avoir été ramassée
};

// SCORE DES ÉLÉMENTS DU PLATEAU
export const SCORE_VALUES: Record<string, number> = {
  bumper: 1000,
  slingshot: 250,
  kickback: 5000,
  minePlank: 2500,
  fakirTarget: 500,
  gemsToggle: 5000,

  // Classes
  dwarfPerk: 5000,
};

// LOGIQUE DU MULTIPLICATEUR
// Les sources de multiplicateurs
export type MultiplierSource =
  | "lightRoad"
  | "fakirSimple"
  | "fakirMedium"
  | "mine"
  | "fakirHard"
  | "gems"
  | "sunBonus";

// Configuration de base des multiplicateurs (valeur et durée)
export const MULTIPLIERS_CONFIG: Record<
  MultiplierSource,
  { value: number; durationMs: number }
> = {
  lightRoad: { value: 2, durationMs: 10000 },
  fakirSimple: { value: 4, durationMs: 15000 },
  fakirMedium: { value: 6, durationMs: 15000 },
  mine: { value: 8, durationMs: 15000 }, // Le passif du Nain pourra l'écraser plus tard
  fakirHard: { value: 10, durationMs: 15000 },
  gems: { value: 12, durationMs: 30000 },
  sunBonus: { value: 50, durationMs: 50000 },
};

// Les classes qui écrasent la valeur de base d'un multiplicateur
export const CLASS_MULTIPLIER_OVERRIDES: Partial<
  Record<PlayerClass, Partial<Record<MultiplierSource, number>>>
> = {
  Dwarf: {
    mine: 12, // Le Nain écrase le x8 de la mine pour le remplacer par un x12
  },
};

// Les conditions requises pour déclencher le méga Sun Bonus
export const SUN_BONUS_REQUIRED_SOURCES: MultiplierSource[] = [
  "lightRoad",
  "fakirSimple",
  "fakirMedium",
  "fakirHard",
  "mine",
  "gems",
];
