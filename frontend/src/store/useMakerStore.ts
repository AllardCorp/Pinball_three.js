import { create } from "zustand";

export interface MakerElement {
  id: string;
  name: string;
  type: "cylinder" | "box" | "sphere";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface MakerState {
  elements: MakerElement[];
  selectedElementId: string | null;
  addElement: (type: "cylinder" | "box" | "sphere") => void;
  updateElementTransform: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
  removeElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
}

export const useMakerStore = create<MakerState>((set) => ({
  elements: [],
  selectedElementId: null,
  addElement: (type) =>
    set((state) => {
      const counts = state.elements.reduce((acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const index = (counts[type] || 0) + 1;
      const typeLabel =
        type === "cylinder" ? "Bumper" : type === "box" ? "Wall" : "Target";
      const name = `${typeLabel} ${index}`;
      const id = crypto.randomUUID();

      const newElement: MakerElement = {
        id,
        name,
        type,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
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
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId:
        state.selectedElementId === id ? null : state.selectedElementId,
    })),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
}));
