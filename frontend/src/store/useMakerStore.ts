import { create } from "zustand";

export interface MakerElement {
  id: string;
  name: string;
  type: "cylinder" | "box" | "sphere";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  roughness?: number; // 0 (brillant) à 1 (mat)
  metalness?: number; // 0 (plastique) à 1 (métallique)
  isBumper?: boolean; // comportement physique : effet rebond actif
  bumpStrength?: number; // force de rebond physique
}

export interface LevelListItem {
  id: string;
  name: string;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LevelDetail extends LevelListItem {
  elements: MakerElement[];
}

interface MakerState {
  elements: MakerElement[];
  selectedElementId: string | null;
  levelName: string;
  levelId: string | null;
  addElement: (type: "cylinder" | "box" | "sphere") => void;
  updateElementTransform: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
  updateElementProperties: (id: string, properties: Partial<MakerElement>) => void;
  removeElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setLevelName: (name: string) => void;
  loadLevel: (level: LevelDetail) => void;
  resetLevel: () => void;
}

export const useMakerStore = create<MakerState>((set) => ({
  elements: [],
  selectedElementId: null,
  levelName: "Mon niveau",
  levelId: null,
  addElement: (type) =>
    set((state) => {
      const counts = state.elements.reduce((acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const index = (counts[type] || 0) + 1;
      const typeLabel =
        type === "cylinder" ? "Cylindre" : type === "box" ? "Cube" : "Sphère";
      const name = `${typeLabel} ${index}`;
      const id = crypto.randomUUID();

      const newElement: MakerElement = {
        id,
        name,
        type,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: type === "cylinder" ? "#3b82f6" : type === "box" ? "#ef4444" : "#10b981",
        roughness: type === "cylinder" ? 0.2 : type === "box" ? 0.4 : 0.1,
        metalness: type === "cylinder" ? 0.8 : type === "box" ? 0.1 : 0.9,
        isBumper: false,
        bumpStrength: 15,
      };

      return {
        elements: [...state.elements, newElement],
        selectedElementId: id,
      };
    }),
  updateElementTransform: (id, position, rotation, scale) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, position, rotation, scale } : el
      ),
    })),
  updateElementProperties: (id, properties) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...properties } : el
      ),
    })),
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId:
        state.selectedElementId === id ? null : state.selectedElementId,
    })),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setLevelName: (name) => set({ levelName: name }),
  loadLevel: (level) =>
    set({
      elements: level.elements,
      selectedElementId: null,
      levelName: level.name,
      levelId: level.id,
    }),
  resetLevel: () =>
    set({
      elements: [],
      selectedElementId: null,
      levelName: "Mon niveau",
      levelId: null,
    }),
}));
