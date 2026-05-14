import mqtt, { MqttClient } from "mqtt";

let client: MqttClient | null = null;

export function connectMqtt(): MqttClient {
  if (client) return client;

  client = mqtt.connect("ws://localhost:9001");

  client.on("connect", () => {
    console.log("✅ MQTT connected via WebSocket");
  });

  client.on("error", (err) => {
    console.log("MQTT error (broker probably offline)", err.message);
  });

  return client;
}

export function getMqttClient(): MqttClient | null {
  return client;
}
