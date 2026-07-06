// On importe les interfaces des futurs slices
import { type PlayerSlice } from "./slices/createPlayerSlice";
import { type PlayfieldSlice } from "./slices/createPlayfieldSlice";
import { type CoreSlice } from "./slices/createCoreSlice";
import { type MultiplierSlice } from "./slices/createMultiplierSlice";
import { type ClassSlice } from "./slices/createClassSlice";
// Le type global est la fusion de tous les slices
export interface GameState
  extends PlayerSlice, PlayfieldSlice, CoreSlice, MultiplierSlice, ClassSlice {}

// --- LOGIQUE DE SYNCHRONISATION (API BroadcastChannel) ---
export const channel =
  typeof window !== "undefined" ? new BroadcastChannel("pinball-game") : null;

export const syncState = (state: Partial<GameState>) => {
  if (channel) {
    channel.postMessage(state);
  }
};
