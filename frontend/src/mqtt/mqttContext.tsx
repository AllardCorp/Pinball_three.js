import { createContext, useContext, useEffect, useState } from "react";
import type { MqttClient } from "mqtt";
import { connectMqtt } from "./mqttClient";
import { useInputStore } from "@/store/useInputStore";

const MqttContext = createContext<MqttClient | null>(null);
const TOPIC = "pinball/input/state";

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = connectMqtt();
    setClient(mqttClient);
    // Gestionnaire des messages MQTT entrants
    const handleMessage = (topic: string, message: Buffer) => {
      if (topic === TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          // Mise à jour de notre store local
          useInputStore.getState().updateInputs({
            buttons: payload.buttons,
            analog: payload.analog,
          });
        } catch (error) {
          console.error("❌ Erreur de parsing du message MQTT:", error);
        }
      }
    };

    mqttClient.on("message", handleMessage);
    mqttClient.subscribe(TOPIC);

    return () => {
      mqttClient.off("message", handleMessage);
      mqttClient.unsubscribe(TOPIC);
    };
  }, []);

  return (
    <MqttContext.Provider value={client}>
      {children}
    </MqttContext.Provider>
  );
}

export function useMqtt(): MqttClient | null {
  return useContext(MqttContext);
}
