import { useEffect, useRef } from "react";
import { useMqtt } from "./mqttContext";

const TOPIC = "pinball/input/state";

/**
 * Maps keyboard keys to pinball actions and publishes MQTT messages.
 *
 * Key mapping (matches the mock-esp32 script):
 *   Q     → left flipper
 *   D     → right flipper
 *   Space → plunger (hold to charge)
 *   S     → start
 *   C     → coin insert
 */
export function useKeyboardControls() {
  const client = useMqtt();

  // Mutable state kept in refs so event listeners always see the latest values
  const state = useRef({
    buttons: {
      left_flipper: false,
      right_flipper: false,
      start: false,
      coin_slot: false,
      launch_ball: false,
    },
    analog: {
      plunger: 0.0,
      nudge: { x: 0.0, y: 0.0, z: 9.81 },
    },
  });

  const plungerStartTime = useRef(0);
  const plungerCharging = useRef(false);
  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const PLUNGER_CHARGE_DURATION_MS = 2000;

  // ── Helpers ──────────────────────────────────────
  function publish() {
    if (!client) return;
    const payload = {
      timestamp: Date.now(),
      buttons: { ...state.current.buttons },
      analog: {
        plunger: parseFloat(state.current.analog.plunger.toFixed(3)),
        nudge: { ...state.current.analog.nudge },
      },
    };
    client.publish(TOPIC, JSON.stringify(payload));
  }

  function releasePlunger() {
    plungerCharging.current = false;
    if (chargeInterval.current) {
      clearInterval(chargeInterval.current);
      chargeInterval.current = null;
    }
    const force = state.current.analog.plunger;
    console.log(`🚀 Plunger released with force: ${force.toFixed(2)}`);

    state.current.buttons.launch_ball = true;
    publish();

    setTimeout(() => {
      state.current.buttons.launch_ball = false;
      state.current.analog.plunger = 0.0;
      publish();
    }, 50);
  }

  useEffect(() => {
    if (!client) return;

    const activeKeys = new Set<string>();

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();

      // Prevent repeated keydown events while key is held
      if (activeKeys.has(key)) return;
      activeKeys.add(key);

      switch (key) {
        case "q":
          state.current.buttons.left_flipper = true;
          console.log("🏓 Left flipper ON");
          publish();
          break;

        case "d":
          state.current.buttons.right_flipper = true;
          console.log("🏓 Right flipper ON");
          publish();
          break;

        case " ":
          e.preventDefault(); // prevent page scroll
          if (!plungerCharging.current) {
            plungerCharging.current = true;
            plungerStartTime.current = Date.now();
            console.log("⏳ Plunger charging...");
            // Update charge value periodically
            chargeInterval.current = setInterval(() => {
              const elapsed = Date.now() - plungerStartTime.current;
              state.current.analog.plunger = Math.min(
                1.0,
                elapsed / PLUNGER_CHARGE_DURATION_MS,
              );
              publish();
            }, 50);
          }
          break;

        case "s":
          state.current.buttons.start = true;
          console.log("▶️  Start pressed");
          publish();
          break;

        case "c":
          state.current.buttons.coin_slot = true;
          console.log("🪙 Coin inserted");
          publish();
          break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      activeKeys.delete(key);

      switch (key) {
        case "q":
          state.current.buttons.left_flipper = false;
          console.log("🏓 Left flipper OFF");
          publish();
          break;

        case "d":
          state.current.buttons.right_flipper = false;
          console.log("🏓 Right flipper OFF");
          publish();
          break;

        case " ":
          if (plungerCharging.current) {
            releasePlunger();
          }
          break;

        case "s":
          state.current.buttons.start = false;
          publish();
          break;

        case "c":
          state.current.buttons.coin_slot = false;
          publish();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (chargeInterval.current) clearInterval(chargeInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);
}
