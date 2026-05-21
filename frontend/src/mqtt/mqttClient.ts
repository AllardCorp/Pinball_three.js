import mqtt, { MqttClient, type IClientOptions } from "mqtt";

let client: MqttClient | null = null;

export function connectMqtt(): MqttClient {
  if (client) return client;

  // Lecture des identifiants injectés par Vite
  const username = import.meta.env.VITE_MQTT_USERNAME;
  const password = import.meta.env.VITE_MQTT_PASSWORD;

  const options: IClientOptions = {};
  if (username && password) {
    options.username = username;
    options.password = password;
  }

  client = mqtt.connect("ws://localhost:9001", options);

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
