import mqtt from "mqtt";
import readline from "readline";

// ============================================================
// MODE SELECTION
// Change this flag to switch between interactive and auto mode
// ============================================================
const MODE = "interactive"; // "interactive" | "auto"

const BROKER_URL = "mqtt://localhost:1883";
const TOPIC = "pinball/input/state";
const PUBLISH_RATE_MS = 50; // 20Hz, similar to a real ESP32

// ─── State ──────────────────────────────────────────────────
const state = {
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
};

// ─── Plunger charge ─────────────────────────────────────────
const PLUNGER_CHARGE_DURATION_MS = 2000; // time to reach 1.0
let plungerCharging = false;
let plungerStartTime = 0;

function updatePlungerCharge() {
  if (plungerCharging) {
    const elapsed = Date.now() - plungerStartTime;
    state.analog.plunger = Math.min(1.0, elapsed / PLUNGER_CHARGE_DURATION_MS);
  }
}

let mqttClient = null; // set on connect, used by releasePlunger/pulse

function releasePlunger() {
  plungerCharging = false;
  const force = state.analog.plunger;
  console.log(`🚀 Plunger released with force: ${force.toFixed(2)}`);
  state.buttons.launch_ball = true;
  if (mqttClient) publishNow(mqttClient);
  setTimeout(() => {
    state.buttons.launch_ball = false;
    state.analog.plunger = 0.0;
    if (mqttClient) publishNow(mqttClient);
  }, PUBLISH_RATE_MS);
}

// ─── Nudge helpers ──────────────────────────────────────────
const NUDGE_FORCE = 2.0;
const NUDGE_DECAY = 0.85;

function applyNudge(axis, direction) {
  state.analog.nudge[axis] += NUDGE_FORCE * direction;
}

function decayNudge() {
  state.analog.nudge.x *= NUDGE_DECAY;
  state.analog.nudge.y *= NUDGE_DECAY;
  // z stays around 9.81 (gravity)
  if (Math.abs(state.analog.nudge.x) < 0.01) state.analog.nudge.x = 0;
  if (Math.abs(state.analog.nudge.y) < 0.01) state.analog.nudge.y = 0;
}

// ─── MQTT publish (on change only) ──────────────────────────
let lastPayload = "";

function buildPayload() {
  updatePlungerCharge();
  decayNudge();

  return {
    timestamp: Date.now(),
    buttons: { ...state.buttons },
    analog: {
      plunger: parseFloat(state.analog.plunger.toFixed(3)),
      nudge: {
        x: parseFloat(state.analog.nudge.x.toFixed(3)),
        y: parseFloat(state.analog.nudge.y.toFixed(3)),
        z: parseFloat(state.analog.nudge.z.toFixed(2)),
      },
    },
  };
}

function publishIfChanged(client) {
  const payload = buildPayload();
  const { timestamp, ...rest } = payload;
  const serialized = JSON.stringify(rest);

  if (serialized !== lastPayload) {
    lastPayload = serialized;
    client.publish(TOPIC, JSON.stringify(payload));
  }
}

function publishNow(client) {
  const payload = buildPayload();
  const { timestamp, ...rest } = payload;
  lastPayload = JSON.stringify(rest);
  client.publish(TOPIC, JSON.stringify(payload));
}

// ─── Interactive mode ───────────────────────────────────────
function startInteractive(client) {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  console.log("🎮 Mock ESP32 — Interactive mode");
  console.log("─────────────────────────────────");
  console.log("  Q / ←     Left flipper");
  console.log("  D / →     Right flipper");
  console.log("  Space     Plunger (hold to charge)");
  console.log("  S         Start");
  console.log("  C         Coin insert");
  console.log("  J/K/L/M   Nudge (left/up/right/down)");
  console.log("  Ctrl+C    Quit");
  console.log("─────────────────────────────────");

  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      console.log("\n👋 Disconnecting...");
      client.end();
      process.exit(0);
    }

    const name = key.name || str;

    switch (name) {
      // ── Flippers (press = on) ──
      case "q":
      case "left":
        state.buttons.left_flipper = true;
        console.log("🏓 Left flipper ON");
        publishNow(client);
        break;
      case "d":
      case "right":
        state.buttons.right_flipper = true;
        console.log("🏓 Right flipper ON");
        publishNow(client);
        break;

      // ── Plunger (hold space) ──
      case "space":
        if (!plungerCharging) {
          plungerCharging = true;
          plungerStartTime = Date.now();
          console.log("⏳ Plunger charging...");
        }
        break;

      // ── Start / Coin ──
      case "s":
        state.buttons.start = true;
        console.log("▶️  Start pressed");
        publishNow(client);
        setTimeout(() => {
          state.buttons.start = false;
          publishNow(client);
        }, 200);
        break;
      case "c":
        state.buttons.coin_slot = true;
        console.log("🪙 Coin inserted");
        publishNow(client);
        setTimeout(() => {
          state.buttons.coin_slot = false;
          publishNow(client);
        }, 200);
        break;

      // ── Nudge (J/K/L/M = left/up/right/down) ──
      case "j":
        applyNudge("x", -1);
        console.log("💥 Nudge left");
        publishNow(client);
        break;
      case "k":
        applyNudge("y", 1);
        console.log("💥 Nudge up");
        publishNow(client);
        break;
      case "l":
        applyNudge("x", 1);
        console.log("💥 Nudge right");
        publishNow(client);
        break;
      case "m":
        applyNudge("y", -1);
        console.log("💥 Nudge down");
        publishNow(client);
        break;
    }
  });

  // Detect key release for flippers and plunger
  // Node stdin doesn't have native keyup — we use a polling approach:
  // flippers auto-release after a short delay, re-pressing resets the timer
  let leftTimer = null;
  let rightTimer = null;
  const FLIPPER_HOLD_MS = 120;

  process.stdin.on("keypress", (str, key) => {
    const name = key.name || str;

    if (name === "q" || name === "left") {
      clearTimeout(leftTimer);
      leftTimer = setTimeout(() => {
        state.buttons.left_flipper = false;
        publishNow(client);
      }, FLIPPER_HOLD_MS);
    }

    if (name === "d" || name === "right") {
      clearTimeout(rightTimer);
      rightTimer = setTimeout(() => {
        state.buttons.right_flipper = false;
        publishNow(client);
      }, FLIPPER_HOLD_MS);
    }
  });

  // Plunger release detection: if no space keypress for 150ms, consider it released
  let spaceTimer = null;
  process.stdin.on("keypress", (str, key) => {
    if ((key.name || str) === "space") {
      clearTimeout(spaceTimer);
      spaceTimer = setTimeout(() => {
        if (plungerCharging) releasePlunger();
      }, 150);
    }
  });

  // Publish loop — only sends if analog values changed (plunger charging, nudge decay)
  setInterval(() => publishIfChanged(client), PUBLISH_RATE_MS);
}

// ─── Auto mode ──────────────────────────────────────────────
function startAuto(client) {
  console.log("🤖 Mock ESP32 — Auto mode");
  console.log("Simulating a full game sequence...\n");

  const actions = [
    { delay: 500, desc: "Insert coin", fn: () => pulse("coin_slot") },
    { delay: 1500, desc: "Press start", fn: () => pulse("start") },
    { delay: 2000, desc: "Charge plunger (light)", fn: () => chargePlunger(400) },
    { delay: 3500, desc: "Left flipper", fn: () => pulse("left_flipper", 300) },
    { delay: 4200, desc: "Right flipper", fn: () => pulse("right_flipper", 250) },
    { delay: 5000, desc: "Nudge left", fn: () => applyNudge("x", -1) },
    { delay: 5800, desc: "Both flippers", fn: () => { pulse("left_flipper", 200); pulse("right_flipper", 200); }},
    { delay: 6500, desc: "Nudge right", fn: () => applyNudge("x", 1) },
    { delay: 7500, desc: "Charge plunger (full)", fn: () => chargePlunger(2000) },
    { delay: 10500, desc: "Left flipper", fn: () => pulse("left_flipper", 350) },
    { delay: 11500, desc: "Nudge up", fn: () => applyNudge("y", 1) },
    { delay: 12500, desc: "Right flipper", fn: () => pulse("right_flipper", 300) },
    { delay: 14000, desc: "Sequence complete", fn: () => {
      console.log("✅ Auto sequence finished.");
      client.end();
      process.exit(0);
    }},
  ];

  for (const action of actions) {
    setTimeout(() => {
      console.log(`  [${(action.delay / 1000).toFixed(1)}s] ${action.desc}`);
      action.fn();
    }, action.delay);
  }

  // Publish loop — only sends if state changed (analog decay, plunger charge)
  setInterval(() => publishIfChanged(client), PUBLISH_RATE_MS);
}

function pulse(button, duration = 200) {
  state.buttons[button] = true;
  if (mqttClient) publishNow(mqttClient);
  setTimeout(() => {
    state.buttons[button] = false;
    if (mqttClient) publishNow(mqttClient);
  }, duration);
}

function chargePlunger(duration) {
  plungerCharging = true;
  plungerStartTime = Date.now();
  console.log(`  ⏳ Plunger charging (${duration}ms)...`);
  setTimeout(() => releasePlunger(), duration);
}

// ─── Connect & start ────────────────────────────────────────
const client = mqtt.connect(BROKER_URL);

client.on("connect", () => {
  mqttClient = client;
  console.log(`✅ Connected to broker at ${BROKER_URL}`);
  console.log(`📡 Publishing to: ${TOPIC}\n`);

  if (MODE === "interactive") {
    startInteractive(client);
  } else {
    startAuto(client);
  }
});

client.on("error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
