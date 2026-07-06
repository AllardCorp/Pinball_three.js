import { create } from "zustand";
import { type GameState, channel } from "./gameStore.types";
import { createPlayerSlice } from "./slices/createPlayerSlice";
import { createPlayfieldSlice } from "./slices/createPlayfieldSlice";
import { createCoreSlice } from "./slices/createCoreSlice";
import { createMultiplierSlice } from "./slices/createMultiplierSlice";
import { createClassSlice } from "./slices/createClassSlice";

export const useGameStore = create<GameState>()((...a) => {
  const [set] = a; // On extrait 'set' pour l'écouteur du channel équivalenet à set = a[0]

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
    ...createMultiplierSlice(...a),
    ...createClassSlice(...a),
  };
});
