import type { InputState } from "@/store/inputStore/useInputStore";

export const BUTTON_BINDINGS: Record<
  string,
  { field: keyof InputState["buttons"] }
> = {
  q: { field: "white_left" },
  d: { field: "white_right" },
  s: { field: "black_left" },
  c: { field: "front_left_yellow" },
};

export const PLUNGER_CHARGE_DURATION_MS = 2000;
