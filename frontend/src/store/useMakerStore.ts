import { create } from "zustand";
import { MAKER_ELEMENT_CONFIG, type MakerElementType } from "@/config/makerElementConfig";

// Représente un obstacle 3D placé sur le plateau (coordonnées, apparence et propriétés de bumper).
export interface MakerElement {
  id: string;
  name: string;
  type: MakerElementType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  roughness?: number; // 0 (brillant) à 1 (mat)
  metalness?: number; // 0 (plastique) à 1 (métallique)
  isBumper?: boolean; // comportement physique : effet rebond actif
  bumpStrength?: number; // force de rebond physique
}

// Données légères de niveau utilisées pour afficher les cartes dans la liste de sélection.
export interface LevelListItem {
  id: string;
  name: string;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

// Données complètes d'un niveau (avec la liste de tous ses obstacles) chargé pour jouer ou éditer.
export interface LevelDetail extends LevelListItem {
  elements: MakerElement[];
}

interface MakerState {
  elements: MakerElement[];
  selectedElementId: string | null;
  levelName: string;
  levelId: string | null;
  addElement: (type: MakerElementType) => void;
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
  setLevelId: (id: string) => void;
  loadLevel: (level: LevelDetail) => void;
  resetLevel: () => void;
}

// Store Zustand principal de l'éditeur gérant l'état en direct du niveau et des interactions 3D.
export const useMakerStore = create<MakerState>((set) => ({
  elements: [],
  selectedElementId: null,
  levelName: "Mon niveau",
  levelId: null,
  // Instancie un nouvel obstacle avec un identifiant unique et les propriétés par défaut de sa configuration.
  addElement: (type) =>
    set((state) => {
      const config = MAKER_ELEMENT_CONFIG[type];
      const id = crypto.randomUUID();

      const newElement: MakerElement = {
        id,
        name: config.label,
        type,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        ...config.defaults,
      };

      return {
        elements: [...state.elements, newElement],
        selectedElementId: id,
      };
    }),
  // Met à jour en continu les coordonnées spatiales de l'objet manipulé en 3D à 60 FPS.
  updateElementTransform: (id, position, rotation, scale) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, position, rotation, scale } : el
      ),
    })),
  // Modifie les propriétés de texture, couleur ou de physique de l'objet depuis l'Inspecteur 2D.
  updateElementProperties: (id, properties) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...properties } : el
      ),
    })),
  // Supprime un obstacle et désélectionne-le s'il était actif.
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId:
        state.selectedElementId === id ? null : state.selectedElementId,
    })),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setLevelName: (name) => set({ levelName: name }),
  setLevelId: (id) => set({ levelId: id }),
  // Charge un niveau complet depuis l'API en conservant les éléments inconnus (tolérance de version).
  loadLevel: (level) =>
    set({
      // `level.elements` reste un passe-plat tel quel : un élément dont le
      // `type` n'est pas (encore) reconnu par MAKER_ELEMENT_CONFIG n'est
      // jamais filtré ici, seul le rendu 3D l'ignore. Ça garantit que
      // rouvrir puis re-sauvegarder un niveau ne supprime pas silencieusement
      // un élément ajouté par une version plus récente du Maker.
      elements: level.elements,
      selectedElementId: null,
      levelName: level.name,
      levelId: level.id,
    }),
  // Réinitialise tout le store pour démarrer un nouveau niveau vide.
  resetLevel: () =>
    set({
      elements: [],
      selectedElementId: null,
      levelName: "Mon niveau",
      levelId: null,
    }),
}));
