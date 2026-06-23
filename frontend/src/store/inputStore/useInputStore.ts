import { create } from "zustand";

// Interface représentant la structure du JSON du topic MQTT "pinball/input/state"
export interface InputState {
  buttons: {
    left_flipper: boolean;
    right_flipper: boolean;
    start: boolean;
    coin_slot: boolean;
    launch_ball: boolean;
  };
  analog: {
    plunger: number; // Force de lancement de la bille (0.0 à 1.0)
    nudge: {
      x: number;
      y: number;
      z: number;
    };
  };
}

interface InputStore extends InputState {
  // Action pour mettre à jour partiellement ou totalement l'état des inputs
  updateInputs: (payload: {
    buttons?: Partial<InputState["buttons"]>;
    analog?: Partial<InputState["analog"]>;
  }) => void;
}

export const useInputStore = create<InputStore>((set) => ({
  // Valeurs initiales par défaut conformes au JSON MQTT
  buttons: {
    left_flipper: false,
    right_flipper: false,
    start: false,
    coin_slot: false,
    launch_ball: false,
  },
  analog: {
    plunger: 0,
    nudge: { x: 0, y: 0, z: 9.81 },
  },
  updateInputs: (payload) =>
    set((state) => ({
      buttons: { ...state.buttons, ...payload.buttons },
      analog: {
        plunger:
          payload.analog?.plunger !== undefined
            ? payload.analog.plunger
            : state.analog.plunger,
        nudge: payload.analog?.nudge
          ? { ...state.analog.nudge, ...payload.analog.nudge }
          : state.analog.nudge,
      },
    })),
}));
