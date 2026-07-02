/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: "flipper" | "public";
  readonly VITE_API_URL?: string;
  readonly VITE_MQTT_PASSWORD?: string;
  readonly VITE_MQTT_URL?: string;
  readonly VITE_MQTT_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
