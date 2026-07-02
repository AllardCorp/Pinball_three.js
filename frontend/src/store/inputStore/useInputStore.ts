import { create } from "zustand";

// Interface représentant la structure du JSON du topic MQTT "pinball/input/state"
export interface InputState {
  buttons: {
    // Actions métier consommées par le playfield.
    // Elles sont dérivées des boutons physiques pour garder les composants 3D
    // indépendants du câblage exact de la borne.
    start: boolean;
    launch_ball: boolean;

    black_left: boolean;
    white_left: boolean;
    front_left_green: boolean;
    front_left_yellow: boolean;
    front_left_red: boolean;
    black_right: boolean;
    white_right: boolean;
    front_white: boolean;
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
    plunger: 0,
    nudge: { x: 0, y: 0, z: 9.81 },
  },
  updateInputs: (payload) =>
    set((state) => {
      const incomingButtons = payload.buttons ?? {};
      const buttons = { ...state.buttons, ...incomingButtons };

      // Mapping actuel validé avec le firmware/mock MQTT :
      // black_left démarre la partie, front_white déclenche le lanceur.
      if (
        incomingButtons.black_left !== undefined &&
        incomingButtons.start === undefined
      ) {
        buttons.start = incomingButtons.black_left;
      }

      if (
        incomingButtons.front_white !== undefined &&
        incomingButtons.launch_ball === undefined
      ) {
        buttons.launch_ball = incomingButtons.front_white;
      }

      return {
        buttons,
        analog: {
          plunger:
            payload.analog?.plunger !== undefined
              ? payload.analog.plunger
              : state.analog.plunger,
          nudge: payload.analog?.nudge
            ? { ...state.analog.nudge, ...payload.analog.nudge }
            : state.analog.nudge,
        },
      };
    }),
}));
