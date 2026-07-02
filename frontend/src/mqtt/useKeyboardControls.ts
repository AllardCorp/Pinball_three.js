import { useEffect, useRef } from "react";
import { useInputStore } from "@/store/inputStore/useInputStore";
import type { InputState } from "@/store/inputStore/useInputStore";
import { BUTTON_BINDINGS, PLUNGER_CHARGE_DURATION_MS } from "./inputBindings";
import { usePlungerCharge } from "./usePlungerCharge";

export function useKeyboardControls() {
  const state = useRef<InputState>({
    buttons: {
      start: false,
      launch_ball: false,
      black_left: false,
      white_left: false,
      front_left_green: false,
      front_left_yellow: false,
      front_left_red: false,
      black_right: false,
      white_right: false,
      front_white: false,
    },
    analog: {
      plunger: 0.0,
      nudge: { x: 0.0, y: 0.0, z: 9.81 },
    },
  });

  function publish() {
    useInputStore.getState().updateInputs({
      buttons: { ...state.current.buttons },
      analog: {
        plunger: parseFloat(state.current.analog.plunger.toFixed(3)),
        nudge: { ...state.current.analog.nudge },
      },
    });
  }

  const plunger = usePlungerCharge(
    (value) => {
      state.current.analog.plunger = value;
      publish();
    },
    (force) => {
      state.current.analog.plunger = force;
      state.current.buttons.front_white = true;
      publish();
      setTimeout(() => {
        state.current.buttons.front_white = false;
        state.current.analog.plunger = 0;
        publish();
      }, 50);
    },
    PLUNGER_CHARGE_DURATION_MS,
  );

  useEffect(() => {
    const activeKeys = new Set<string>();

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (activeKeys.has(key)) return;
      activeKeys.add(key);

      const binding = BUTTON_BINDINGS[key];
      if (binding) {
        state.current.buttons[binding.field] = true;
        publish();
        return;
      }
      if (key === " ") {
        e.preventDefault();
        plunger.start();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      activeKeys.delete(key);

      const binding = BUTTON_BINDINGS[key];
      if (binding) {
        state.current.buttons[binding.field] = false;
        publish();
        return;
      }
      if (key === " ") plunger.release();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      plunger.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
