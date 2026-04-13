// import mqtt from "mqtt";

// const BROKER_URL = "mqtt://localhost:1883";
// const TOPIC = "pinball/input/state";

// const client = mqtt.connect(BROKER_URL);

// client.on("connect", () => {
//   console.log(`✅ Connected to broker at ${BROKER_URL}`);
//   console.log(`👂 Subscribed to: ${TOPIC}`);
//   console.log("─────────────────────────────────");
//   console.log("Waiting for keyboard input from the frontend...\n");
//   client.subscribe(TOPIC);
// });

// client.on("message", (_topic, message) => {
//   try {
//     const data = JSON.parse(message.toString());
//     const { buttons, analog } = data;

//     // Build a human-readable log line
//     const active = [];

//     if (buttons.left_flipper)  active.push("🏓 Left flipper ON");
//     if (buttons.right_flipper) active.push("🏓 Right flipper ON");
//     if (buttons.start)         active.push("▶️  Start pressed");
//     if (buttons.coin_slot)     active.push("🪙 Coin inserted");
//     if (buttons.launch_ball)   active.push("🚀 Launch ball");

//     if (analog.plunger > 0) {
//       active.push(`⏳ Plunger: ${(analog.plunger * 100).toFixed(0)}%`);
//     }

//     if (active.length > 0) {
//       const ts = new Date(data.timestamp).toLocaleTimeString();
//       console.log(`[${ts}]  ${active.join("  |  ")}`);
//     }
//   } catch {
//     console.log("Raw message:", message.toString());
//   }
// });

// client.on("error", (err) => {
//   console.error("❌ Connection error:", err.message);
//   process.exit(1);
// });
