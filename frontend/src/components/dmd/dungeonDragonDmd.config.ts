import elfBowUrl from "@/assets/dmd/arc-dmd.png";
import warriorShieldUrl from "@/assets/dmd/bouclier-dmd.png";
import necromancerSkullUrl from "@/assets/dmd/crane-dmd.png";
import mineOpeningSpriteUrl from "@/assets/dmd/anime-mine.png";
import dwarfHammerUrl from "@/assets/dmd/marteau-dmd.png";
import rubyRewardSpriteUrl from "@/assets/dmd/rubis-dmd.png";

import type { ClassIcon, DiodeTone } from "./dungeonDragonDmd.types";

// Le DMD travaille sur une matrice logique basse résolution.
// Le canvas réel peut être en 1920x1080 : le renderer convertit ensuite les
// coordonnées DMD vers les pixels physiques.
export const MATRIX_WIDTH = 192;
export const MATRIX_HEIGHT = 64;
export const FRAME_RATE = 30;

export const CLASS_ICON_SIZE = 30;

export const MINE_SPRITE_FRAME_COUNT = 16;
export const MINE_SPRITE_FRAME_HEIGHT = 48;
export const MINE_SPRITE_FRAME_WIDTH = 64;
export const MINE_OPENING_SPRITE_URL = mineOpeningSpriteUrl;

export const RUBY_SPRITE_FRAME_COUNT = 10;
export const RUBY_SPRITE_FRAME_HEIGHT = 38;
export const RUBY_SPRITE_FRAME_WIDTH = 62;
export const RUBY_SPRITE_URL = rubyRewardSpriteUrl;
// Durée pendant laquelle le rubis prend la zone centrale du DMD après
// activation du multiplicateur gems. Le multiplicateur reste actif après ça.
export const RUBY_EFFECT_DURATION_MS = 3_200;

export const DIODE_COLORS: Record<DiodeTone, string> = {
  amber: "#c6862e",
  bright: "#f1d08a",
  danger: "#ad4a2f",
  dim: "#3a2815",
  stone: "#1f1710",
};

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
    centerX: 110,
    eventMaxWidth: 96,
    eventPreferredScale: 2,
    eventY: 4,
    impactY: 19,
    maxWidth: 104,
    normalY: 19,
  },
  multipliers: {
    maxWidth: 22,
    slotY: 45,
    slots: [48, 68, 88, 108, 132],
    underlineWidth: 14,
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
  rubyAnimation: {
    alpha: 0.86,
    centerX: 96,
    centerY: 38,
    frameHold: 3,
    maxRadiusX: 31,
    maxRadiusY: 17,
    minRadiusX: 16,
    minRadiusY: 9,
    sparkleCount: 18,
    sparkleRadiusX: 47,
    sparkleRadiusY: 22,
  },
} as const;

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

export const HEART_PATTERN = [
  "0110110",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
] as const;

export const CLASS_ICON_IMAGE_SOURCES: Partial<Record<ClassIcon, string>> = {
  dwarf: dwarfHammerUrl,
  elf: elfBowUrl,
  necromancer: necromancerSkullUrl,
  warrior: warriorShieldUrl,
};

// Fallbacks simples si un asset ne charge pas. Les icônes finales restent les
// PNG convertis en diodes, mais le DMD ne doit jamais tomber sur une zone vide.
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
