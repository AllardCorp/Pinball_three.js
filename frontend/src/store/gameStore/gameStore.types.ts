// On importe les interfaces des futurs slices
import { type PlayerSlice } from "./slices/createPlayerSlice";
import { type PlayfieldSlice } from "./slices/createPlayfieldSlice";
import { type CoreSlice } from "./slices/createCoreSlice";
import { type MultiplierSlice } from "./slices/createMultiplierSlice";
import { type ClassSlice } from "./slices/createClassSlice";
// Le type global est la fusion de tous les slices
export interface GameState
  extends PlayerSlice, PlayfieldSlice, CoreSlice, MultiplierSlice, ClassSlice {}

// --- LOGIQUE DE SYNCHRONISATION (BroadcastChannel) ---
export const channel =
  typeof window !== "undefined" ? new BroadcastChannel("pinball-game") : null;

// Les écrans du flipper peuvent être ouverts dans plusieurs fenêtres
// indépendantes. On diffuse donc uniquement les champs sérialisables nécessaires
// au DMD/backglass, jamais les actions Zustand qui ne peuvent pas transiter par
// BroadcastChannel.
export type SyncedGameState = Pick<
  GameState,
  | "ballInLauncher"
  | "ballsRemaining"
  | "currentPlayerIndex"
  | "isPlaying"
  | "leftKickbackActive"
  | "mineHits"
  | "playerCount"
  | "rightKickbackActive"
  | "rubiesActive"
  | "scoreMultiplier"
  | "scores"
  | "screenMessage"
>;

export function getSyncedGameState(state: GameState): SyncedGameState {
  return {
    ballInLauncher: state.ballInLauncher,
    ballsRemaining: state.ballsRemaining,
    currentPlayerIndex: state.currentPlayerIndex,
    isPlaying: state.isPlaying,
    leftKickbackActive: state.leftKickbackActive,
    mineHits: state.mineHits,
    playerCount: state.playerCount,
    rightKickbackActive: state.rightKickbackActive,
    rubiesActive: state.rubiesActive,
    scoreMultiplier: state.scoreMultiplier,
    scores: state.scores,
    screenMessage: state.screenMessage,
  };
}

export const syncState = (state: SyncedGameState) => {
  if (channel) {
    channel.postMessage(state);
  }
};
