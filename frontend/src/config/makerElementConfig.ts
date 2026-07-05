// Source unique de vérité pour les types d'éléments du Maker.
// Ajouter un type = une entrée ici (+ le même nom dans
// backend/src/domain/maker-elements.ts, qui n'est pas partagé automatiquement
// faute de package commun entre frontend et backend).
export const MAKER_ELEMENT_TYPES = ["cylinder", "box", "sphere"] as const;

export type MakerElementType = (typeof MAKER_ELEMENT_TYPES)[number];

type MakerElementGeometry =
  | { kind: "cylinderGeometry"; args: [number, number, number, number] }
  | { kind: "boxGeometry"; args: [number, number, number] }
  | { kind: "sphereGeometry"; args: [number, number, number] };

export type MakerElementDefaults = {
  color: string;
  roughness: number;
  metalness: number;
  isBumper: boolean;
  bumpStrength: number;
};

export type MakerElementTypeConfig = {
  label: string;
  emoji: string;
  paletteColorClass: string;
  selectedColor: string;
  geometry: MakerElementGeometry;
  defaults: MakerElementDefaults;
};

export const MAKER_ELEMENT_CONFIG: Record<MakerElementType, MakerElementTypeConfig> = {
  cylinder: {
    label: "Cylindre",
    emoji: "🔵",
    paletteColorClass: "bg-blue-600 hover:bg-blue-500",
    selectedColor: "#ea580c",
    geometry: { kind: "cylinderGeometry", args: [1.5, 1.5, 1, 32] },
    defaults: {
      color: "#3b82f6",
      roughness: 0.2,
      metalness: 0.8,
      isBumper: false,
      bumpStrength: 15,
    },
  },
  box: {
    label: "Cube",
    emoji: "🟥",
    paletteColorClass: "bg-red-600 hover:bg-red-500",
    selectedColor: "#ea580c",
    geometry: { kind: "boxGeometry", args: [2, 2, 2] },
    defaults: {
      color: "#ef4444",
      roughness: 0.4,
      metalness: 0.1,
      isBumper: false,
      bumpStrength: 15,
    },
  },
  sphere: {
    label: "Sphère",
    emoji: "🟢",
    paletteColorClass: "bg-green-600 hover:bg-green-500",
    selectedColor: "#ea580c",
    geometry: { kind: "sphereGeometry", args: [1.2, 32, 32] },
    defaults: {
      color: "#10b981",
      roughness: 0.1,
      metalness: 0.9,
      isBumper: false,
      bumpStrength: 15,
    },
  },
};

export function isMakerElementType(value: unknown): value is MakerElementType {
  return (
    typeof value === "string" &&
    (MAKER_ELEMENT_TYPES as readonly string[]).includes(value)
  );
}

// Retourne `undefined` pour un type inconnu (niveau sauvegardé par une
// version plus récente du Maker) — c'est au rendu d'ignorer proprement
// l'élément plutôt qu'à ce fichier de faire des suppositions.
export function getMakerElementConfig(type: string): MakerElementTypeConfig | undefined {
  return isMakerElementType(type) ? MAKER_ELEMENT_CONFIG[type] : undefined;
}
