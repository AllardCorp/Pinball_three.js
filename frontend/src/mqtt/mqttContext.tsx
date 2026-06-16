import { createContext, useContext, useEffect, useState } from "react";
import type { MqttClient } from "mqtt";
import { connectMqtt } from "./mqttClient";
import { useInputStore, type InputState } from "@/store/useInputStore";

const MqttContext = createContext<MqttClient | null>(null);
const TOPIC = "pinball/input/state";

/**
 * Assainit, valide et filtre le payload brut reçu du topic MQTT `pinball/input/state`.
 * * Cette fonction agit comme une barrière de sécurité (sandbox) pour s'assurer que
 * les données corrompues, incomplètes ou malveillantes envoyées par le broker
 * ne fassent pas planter l'application React lors de la décomposition (spread) dans le store.
 *
 * @param {any} payload - Le payload JSON brut décodé depuis le message MQTT.
 * * @returns {Object} Un objet partiel sécurisé contenant les boutons et/ou données analogiques validés.
 * @returns {Partial<InputState["buttons"]>} [return.buttons] - Un objet contenant uniquement les états des boutons connus et transtypés en booléens.
 * @returns {Partial<InputState["analog"]>} [return.analog] - Un objet contenant les données du plunger (clamped [0-1]) et du nudge (fusionné).
 * * @example
 * // Exemple de payload MQTT attendu :
 * // {
 * //   "buttons": { "left_flipper": true, "start": false },
 * //   "analog": { "plunger": 0.5, "nudge": { "x": 0.1, "y": 0.0, "z": 9.8 } }
 * // }
 */

// 🛡️ FONCTION DE VALIDATION ET D'ASSAINISSEMENT
function sanitizePayload(payload: any): {
  buttons?: Partial<InputState["buttons"]>;
  analog?: Partial<InputState["analog"]>;
} {
  const sanitized: ReturnType<typeof sanitizePayload> = {};

  // 1. Validation des boutons
  if (
    payload &&
    typeof payload.buttons === "object" &&
    payload.buttons !== null
  ) {
    sanitized.buttons = {};
    const b = payload.buttons;

    // On ne garde et ne transtype que ce que l'on connaît
    if ("left_flipper" in b)
      sanitized.buttons.left_flipper = Boolean(b.left_flipper);
    if ("right_flipper" in b)
      sanitized.buttons.right_flipper = Boolean(b.right_flipper);
    if ("start" in b) sanitized.buttons.start = Boolean(b.start);
    if ("coin_slot" in b) sanitized.buttons.coin_slot = Boolean(b.coin_slot);
    if ("launch_ball" in b)
      sanitized.buttons.launch_ball = Boolean(b.launch_ball);
  }

  // 2. Validation des données analogiques
  if (
    payload &&
    typeof payload.analog === "object" &&
    payload.analog !== null
  ) {
    sanitized.analog = {};
    const a = payload.analog;

    // Plunger : aucun problème ici
    if ("plunger" in a && typeof a.plunger === "number" && !isNaN(a.plunger)) {
      sanitized.analog.plunger = Math.max(0, Math.min(1, a.plunger));
    }

    // Nudge (Accéléromètre) :
    if (a.nudge && typeof a.nudge === "object" && a.nudge !== null) {
      // 1. On crée un objet de fallback ou on récupère l'état actuel du store
      // pour fusionner proprement les coordonnées manquantes
      const currentNudge = useInputStore.getState().analog.nudge;

      const nextNudge = {
        x:
          typeof a.nudge.x === "number" && !isNaN(a.nudge.x)
            ? a.nudge.x
            : currentNudge.x,
        y:
          typeof a.nudge.y === "number" && !isNaN(a.nudge.y)
            ? a.nudge.y
            : currentNudge.y,
        z:
          typeof a.nudge.z === "number" && !isNaN(a.nudge.z)
            ? a.nudge.z
            : currentNudge.z,
      };

      // 2. Maintenant l'objet possède obligatoirement x, y et z. TypeScript est content !
      sanitized.analog.nudge = nextNudge;
    }
  }

  return sanitized;
}

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = connectMqtt();
    setClient(mqttClient);

    const handleMessage = (topic: string, message: Uint8Array) => {
      if (topic === TOPIC) {
        try {
          const rawPayload = JSON.parse(new TextDecoder().decode(message));

          // 🛡️ On nettoie les données reçues avant de les injecter dans le store
          const sanitized = sanitizePayload(rawPayload);

          // Si le payload nettoyé contient des choses valides, on met à jour
          if (sanitized.buttons || sanitized.analog) {
            useInputStore.getState().updateInputs(sanitized);
          }
        } catch (error) {
          console.error(
            "❌ Erreur de parsing ou de validation du message MQTT:",
            error,
          );
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

  return <MqttContext.Provider value={client}>{children}</MqttContext.Provider>;
}

export function useMqtt(): MqttClient | null {
  return useContext(MqttContext);
}
