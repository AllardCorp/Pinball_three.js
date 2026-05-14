import { createContext, useContext, useEffect, useState } from "react";
import type { MqttClient } from "mqtt";
import { connectMqtt } from "./mqttClient";

const MqttContext = createContext<MqttClient | null>(null);

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = connectMqtt();
    setClient(mqttClient);
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
