import elfBowUrl from "@/assets/dmd/arc-dmd.png";
import warriorShieldUrl from "@/assets/dmd/bouclier-dmd.png";
import necromancerSkullUrl from "@/assets/dmd/crane-dmd.png";
import mineOpeningSpriteUrl from "@/assets/dmd/anime-mine.png";
import dwarfHammerUrl from "@/assets/dmd/marteau-dmd.png";
import type { DmdViewModel } from "@/lib/dmd-messages";

// Contrat visuel du thème Dungeons & Dragon pour le DMD.
// Ce fichier ne dessine rien : il centralise les dimensions, couleurs, assets
// et positions afin que le renderer canvas reste focalisé sur le dessin.
// C'est aussi le fichier à modifier en priorité pour ajuster le placement.

export type RenderMetrics = {
  cellHeight: number;
  cellWidth: number;
  radius: number;
};

export type DiodeTone = "dim" | "amber" | "bright" | "danger" | "stone";
export type ClassIcon = NonNullable<DmdViewModel["activeClass"]>;
export type DmdIconPatterns = Partial<Record<ClassIcon, readonly string[]>>;
export type DmdSpriteFrames = readonly (readonly string[])[];

// Grille logique du DMD.
// On ne travaille jamais directement en pixels physiques ici : le renderer
// convertit ensuite cette grille vers la taille réelle du canvas.
export const MATRIX_WIDTH = 192;
export const MATRIX_HEIGHT = 64;

// Limite volontaire de FPS.
// Le DMD tourne en parallèle du playfield Three.js ; 30 FPS suffisent pour
// un affichage à diodes et limitent la charge CPU/GPU.
export const FRAME_RATE = 30;

// Police bitmap interne 5x7.
// Elle garantit que le texte est réellement composé de diodes allumées,
// contrairement à une police CSS qui serait lissée par le navigateur.
export const FONT_WIDTH = 5;

// Résolution cible des pictogrammes de classes après conversion image -> diodes.
export const CLASS_ICON_SIZE = 30;

// Dimensions de la sprite sheet d'ouverture de mine.
// La sheet attendue est horizontale : 16 frames de 64x48.
export const MINE_SPRITE_FRAME_COUNT = 16;
export const MINE_SPRITE_FRAME_HEIGHT = 48;
export const MINE_SPRITE_FRAME_WIDTH = 64;
export const MINE_OPENING_SPRITE_URL = mineOpeningSpriteUrl;

/**
 * Repère principal du DMD.
 *
 * Le canvas réel peut faire 1920x1080, mais tout le dessin est piloté par
 * une grille logique de 192 colonnes x 64 lignes.
 *
 * Pour déplacer un élément :
 * - augmenter `x` le déplace vers la droite
 * - diminuer `x` le déplace vers la gauche
 * - augmenter `y` le descend
 * - diminuer `y` le remonte
 *
 * Modifier ces valeurs est la manière la plus sûre d'ajuster le layout live.
 */
export const LIVE_LAYOUT = {
  playerToken: {
    scale: 1,
    x: 8,
    y: 2,
  },
  lives: {
    gap: 3,
    rightPadding: 6,
    scale: 2,
    y: 2,
  },
  classIcon: {
    centerX: 26,
    centerY: 29,
  },
  score: {
    centerX: 96,
    impactY: 19,
    mineMaxWidth: 96,
    minePreferredScale: 2,
    mineY: 4,
    maxWidth: 100,
    normalY: 19,
  },
  multipliers: {
    maxWidth: 24,
    slotY: 45,
    slots: [58, 82, 106, 132],
    underlineWidth: 16,
    underlineY: 54,
    x50MaxWidth: 88,
    x50Y: 43,
  },
  message: {
    centerX: 96,
    maxWidth: 140,
    scrollThreshold: 150,
    y: 55,
  },
  mineAnimation: {
    alpha: 0.82,
    centerX: 96,
    centerY: 39,
    frameHold: 6,
  },
} as const;

/**
 * Positions des scènes hors partie.
 *
 * Ces valeurs ne touchent pas au layout live. Elles pilotent seulement :
 * - l'écran d'accueil quand aucune partie n'a encore commencé
 * - l'écran de fin quand la partie est terminée
 */
export const SCENE_LAYOUT = {
  attract: {
    coinCenterX: 96,
    coinCenterY: 12,
    headlineY: 23,
    scrollY: 56,
  },
  gameOver: {
    centerX: 96,
    explosionCenterY: 29,
    headlineY: 18,
    scoreY: 44,
  },
} as const;

export const DIODE_COLORS: Record<DiodeTone, string> = {
  amber: "#c6862e",
  bright: "#f1d08a",
  danger: "#ad4a2f",
  dim: "#3a2815",
  stone: "#1f1710",
};

// Coeur volontairement très simple : il doit rester lisible sur une grille
// basse résolution, même vu de loin sur le meuble.
export const HEART_PATTERN = [
  "0110110",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
] as const;

// Images optimisées utilisées pour les classes. Le composant les convertit
// ensuite en motif binaire 30x30 afin de garder un rendu "diodes".
// Si une image change, aucun code de rendu n'est à modifier.
export const CLASS_ICON_IMAGE_SOURCES: Partial<Record<ClassIcon, string>> = {
  dwarf: dwarfHammerUrl,
  elf: elfBowUrl,
  necromancer: necromancerSkullUrl,
  warrior: warriorShieldUrl,
};

// Fallbacks dessinés en code si une image ne charge pas.
// Ils permettent au DMD de rester fonctionnel même sans asset final.
// Les motifs sont volontairement moins détaillés que les PNG : ils servent
// seulement de secours, pas de rendu principal.
export const CLASS_ICON_PATTERNS: Record<ClassIcon, readonly string[]> = {
  dwarf: [
    "000011100000000",
    "000111110000000",
    "000011100000000",
    "000001000000000",
    "000001000000000",
    "000001111111000",
    "000001000001000",
    "000001000001000",
    "111111000001000",
    "000001000001000",
    "000001000001000",
    "000001000001000",
    "000001000001000",
    "000011100001000",
    "000111110000000",
  ],
  elf: [
    "000000111000000",
    "000011000110000",
    "001100000001100",
    "010000000000010",
    "100000000000001",
    "100000000000001",
    "010000000000010",
    "001100000001100",
    "000011000110000",
    "000000111000000",
    "000001010000000",
    "000010001000000",
    "000100000100000",
    "001000000010000",
    "010000000001000",
  ],
  necromancer: [
    "000001111100000",
    "000111111111000",
    "001111111111100",
    "011110011001110",
    "011100011000110",
    "111100111100111",
    "111111111111111",
    "111110111101111",
    "011111000111110",
    "001111111111100",
    "000111111111000",
    "000011011011000",
    "000001010100000",
    "000001000100000",
    "000011101110000",
  ],
  warrior: [
    "000001111100000",
    "000111111111000",
    "001111111111100",
    "011111111111110",
    "011110111101110",
    "011100111001110",
    "011000111000110",
    "001000111000100",
    "001000111000100",
    "000100111001000",
    "000100111001000",
    "000010111010000",
    "000010010010000",
    "000001000100000",
    "000000111000000",
  ],
};

// Police bitmap volontairement interne : chaque lettre est une grille 5x7,
// donc le texte est réellement composé de diodes et non d'une police HTML lissée.
// Ajouter un caractère revient à ajouter une entrée dans cette map.
export const FONT_5X7: Record<string, readonly string[]> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00100", "00100", "01000", "10000", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};
