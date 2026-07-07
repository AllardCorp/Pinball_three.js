import { create } from "zustand";
import { type GameState } from "./gameStore.types";
import { createPlayerSlice } from "./slices/createPlayerSlice";
import { createPlayfieldSlice } from "./slices/createPlayfieldSlice";
import { createCoreSlice } from "./slices/createCoreSlice";
import { createMultiplierSlice } from "./slices/createMultiplierSlice";
import { createClassSlice } from "./slices/createClassSlice";

// Instanciation du canal inter-onglets (avec sécurité SSR pour éviter un crash si 'window' n'est pas défini)
const channel =
  typeof window !== "undefined" ? new BroadcastChannel("pinball-game") : null;

export const useGameStore = create<GameState>()((set, get, api) => {
  // Middleware : Intercepte le 'set' pour synchroniser automatiquement chaque changement d'état sur le réseau.
  const setAndSyncGlobal: typeof set = (...args: any[]) => {
    // Applique la mise à jour localement
    (set as any)(...args);

    // Extrait le delta (gère le cas où l'état partiel passé par la slice est une fonction)
    const partialState = args[0];

    // Si le delta est une fonction, on l'appelle avec l'état actuel pour obtenir le nouvel état partiel. Car on ne peut pas envoyer une fonction sur le canal de diffusion, il faut envoyer l'objet résultant.
    const delta =
      typeof partialState === "function" ? partialState(get()) : partialState;

    // Retire les références aux Timers Node.js qui n'ont aucune valeur en dehors de leur instance respective. Et il font crasher les tests unitaires vitest.
    const safeDelta = { ...delta };
    if ("swordSpawnTimeoutId" in safeDelta) {
      delete safeDelta.swordSpawnTimeoutId;
    }

    // Diffuse le delta aux autres onglets
    if (channel) {
      channel.postMessage(safeDelta);
    }
  };

  // Écouteur réseau : Met à jour le store local avec les données reçues.
  if (channel) {
    channel.onmessage = (event) => {
      // Utilisation du 'set' natif (et non setAndSyncGlobal) pour éviter une boucle infinie de synchronisation.
      set(event.data);
    };
  }

  // Injection du 'set' modifié dans toutes les slices
  return {
    ...createPlayerSlice(setAndSyncGlobal, get, api),
    ...createPlayfieldSlice(setAndSyncGlobal, get, api),
    ...createCoreSlice(setAndSyncGlobal, get, api),
    ...createMultiplierSlice(setAndSyncGlobal, get, api),
    ...createClassSlice(setAndSyncGlobal, get, api),
  };
});
