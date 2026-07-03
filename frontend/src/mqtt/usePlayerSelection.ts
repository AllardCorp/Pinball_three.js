import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useInputStore } from "@/store/inputStore/useInputStore";

export function usePlayerSelection() {
  useEffect(() => {
    const unsubscribe = useInputStore.subscribe((state, prev) => {
      const { isPlaying, playerCount, setPlayerCount, startGame } =
        useGameStore.getState();

      if (isPlaying) return;

      if (state.buttons.white_left && !prev.buttons.white_left) {
        setPlayerCount(Math.max(1, playerCount - 1));
        useInputStore.getState().updateInputs({ buttons: { white_left: false } });
      }

      if (state.buttons.white_right && !prev.buttons.white_right) {
        setPlayerCount(Math.min(4, playerCount + 1));
        useInputStore.getState().updateInputs({ buttons: { white_right: false } });
      }

      if (state.buttons.front_left_green && !prev.buttons.front_left_green) {
        startGame(playerCount);
        useInputStore.getState().updateInputs({ buttons: { front_left_green: false } });
      }
    });

    return unsubscribe;
  }, []);
}
