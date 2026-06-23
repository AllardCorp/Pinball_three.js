import { create } from "zustand";
import { type GameState, channel } from "./gameStore.types";
import { createPlayerSlice } from "./slices/createPlayerSlice";
import { createPlayfieldSlice } from "./slices/createPlayfieldSlice";
import { createCoreSlice } from "./slices/createCoreSlice";

export const useGameStore = create<GameState>()((...a) => {
  const [set] = a; // On extrait 'set' pour l'écouteur du channel

  // Écoute des messages provenant des autres fenêtres (BroadcastChannel)
  if (channel) {
    channel.onmessage = (event) => {
      set(event.data);
    };
  }

  // Fusion des Slices
  // ...a est un tableau contenant [set, get, api], que nous passons à chaque slice pour qu'elles puissent accéder à l'état et aux méthodes de mise à jour.
  return {
    ...createPlayerSlice(...a),
    ...createPlayfieldSlice(...a),
    ...createCoreSlice(...a),
  };
});
