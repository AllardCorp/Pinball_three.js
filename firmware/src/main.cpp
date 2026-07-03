#include <Arduino.h>
#include <WiFi.h>

#define MQTT_MAX_PACKET_SIZE 512
#include <PubSubClient.h>
#include <ArduinoJson.h> 
#include <time.h>        

// --- CONFIGURATION SECURISÉE DU WIFI ---
// Si les identifiants ne sont pas définis dans platformio.ini, on utilise ces valeurs par défaut :
#ifndef WIFI_SSID
#define WIFI_SSID "FLIPHETIC_CAB0"       // Mets le SSID configuré sur la borne
#endif
#ifndef WIFI_PASS
#define WIFI_PASS "dauphin67" // Mets le mot de passe configuré sur la borne
#endif


// --- CONFIGURATION MQTT (CIBLE LA BORNE LOCALEMENT) ---
// D'après la doc Fliphetic, la borne est TOUJOURS joignable à cette IP fixe :
const char* mqtt_server = "10.42.0.1"; 
const int mqtt_port = 1883;
const char* mqtt_user = "pinball_mqtt";
const char* mqtt_pass = "hfucshgnu578qkhfnusghsufhqnecujsgbrguj57485"; 

const char* mqtt_pub_topic = "pinball/input/state";

// --- CONFIGURATION BOUTONS ---
const int NUM_BUTTONS = 9;
const int buttonPins[NUM_BUTTONS] = {16, 4, 17, 18, 19, 13, 25, 33, 32}; 
const char* buttonNames[NUM_BUTTONS] = {
  "black left",
  "white left",
  "front left green",
  "front left yellow",
  "front left red",
  "black right",
  "white right",
  "front white",
  "plunger"
};

// Suivi de l'état réel actuel des boutons (false = relâché, true = appuyé)
bool currentButtonStates[NUM_BUTTONS] = {false, false, false, false, false, false, false, false, false};
unsigned long lastDebounceTime[NUM_BUTTONS] = {0, 0, 0, 0, 0, 0, 0, 0, 0};
const unsigned long debounceDelay = 50; 

// --- VARIABLES POUR LA SIMULATION ANALOGIQUE ---
unsigned long frontWhitePressTime = 0;
bool isFrontWhitePressed = false;
bool triggerLaunch = false; // Sera mis à true 1 seule fois au relâchement
float simulatedPlunger = 0.0;
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL = 50; // Envoyer une maj toutes les 50ms quand maintenu

// --- INSTANCES ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- CONFIGURATION DU TEMPS (NTP via la passerelle de la borne) ---
unsigned long long getEpochMilli() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return 0;
  }
  time(&now);
  return ((unsigned long long)now * 1000ULL) + (millis() % 1000);
}

// --- CONNEXION WIFI ---
void setup_wifi() {
  delay(10);
  Serial.print("\n[WIFI] Tentative de connexion au réseau de la borne : ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int counter = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    counter++;
    
    if (counter > 40) { 
      Serial.println("\n[ERROR] Echec Wi-Fi. Redémarrage de l'ESP32...");
      ESP.restart();
    }
  }
  Serial.println("\n[SUCCESS] Connecté au Wi-Fi de la borne !");
  Serial.print("[IP ATTRIBUÉE PAR LA BORNE] ");
  Serial.println(WiFi.localIP());

  // L'ESP32 a accès à Internet à travers la borne, le NTP fonctionne donc toujours
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("[NTP] Synchronisation de l'heure en cours...");
}

// --- CONNEXION MQTT ---
void reconnect_mqtt() {
  while (!client.connected()) {
    if (WiFi.status() != WL_CONNECTED) {
      setup_wifi();
    }

    Serial.print("[MQTT] Connexion au Mosquitto Local (10.42.0.1)...");
    String clientId = "ESP32-Pinball-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println(" OK !");
    } else {
      Serial.print(" ÉCHEC, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

// --- ENVOI DU JSON PERSONNALISÉ ---
void publishCurrentState() {
  StaticJsonDocument<512> doc;

  doc["timestamp"] = getEpochMilli();

  JsonObject buttons = doc.createNestedObject("buttons");
  buttons["black_left"] = currentButtonStates[0];
  buttons["white_left"] = currentButtonStates[1];
  buttons["front_left_green"] = currentButtonStates[2];
  buttons["front_left_yellow"] = currentButtonStates[3];
  buttons["front_left_red"] = currentButtonStates[4];
  buttons["black_right"] = currentButtonStates[5];
  buttons["white_right"] = currentButtonStates[6];
  // front_white ne sera true qu'à l'instant précis du relâchement pour déclencher Ball.tsx
  buttons["front_white"] = triggerLaunch; 
  buttons["plunger"] = currentButtonStates[8];

  JsonObject analog = doc.createNestedObject("analog");
  analog["plunger"] = simulatedPlunger; // Valeur calculée dans le loop (de 0.0 à 1.0)

  JsonObject analog_nudge = analog.createNestedObject("nudge");
  analog_nudge["x"] = 0.0;
  analog_nudge["y"] = 0.0;
  analog_nudge["z"] = 9.81;

  char buffer[512];
  serializeJson(doc, buffer);
  
  if (client.connected()) {
    client.publish(mqtt_pub_topic, buffer);
    Serial.print("[MQTT PUBLISH LOCAL] ");
    Serial.println(buffer);
  }
}

void setup() {
  Serial.begin(115200);
  client.setBufferSize(512);
  
  // Configuration des boutons
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();

  unsigned long now = millis();

  bool stateChanged = false;

  for (int i = 0; i < NUM_BUTTONS; i++) {
    bool pinReading = (digitalRead(buttonPins[i]) == LOW);

    if (pinReading != currentButtonStates[i]) {
      if (now - lastDebounceTime[i] > debounceDelay) {
        
        currentButtonStates[i] = pinReading;
        lastDebounceTime[i] = now;
        stateChanged = true;

        Serial.print("[STATUT] ");
        Serial.print(buttonNames[i]);
        Serial.println(currentButtonStates[i] ? " : APPUYÉ" : " : RELÂCHÉ");
      }
    }
  }

  // --- LOGIQUE DE SIMULATION DU TIRE-BILLE SUR LE BOUTON FRONT WHITE (INDEX 7) ---
  if (currentButtonStates[7]) { 
    // Le bouton est actuellement enfoncé
    if (!isFrontWhitePressed) {
      // Vient d'être enfoncé
      isFrontWhitePressed = true;
      frontWhitePressTime = now;
    }
    
    // Calcul de la puissance : monte de 0.0 à 1.0 en 2000 ms (2 secondes)
    float elapsedTime = (float)(now - frontWhitePressTime);
    simulatedPlunger = elapsedTime / 2000.0;
    if (simulatedPlunger > 1.0) simulatedPlunger = 1.0;

    // Pendant qu'on maintient le bouton, on spamme le MQTT toutes les 50ms 
    // pour que l'interface puisse animer le tire-bille
    if (now - lastPublishTime > PUBLISH_INTERVAL) {
      publishCurrentState();
      lastPublishTime = now;
    }
  } 
  else {
    // Le bouton n'est pas enfoncé
    if (isFrontWhitePressed) {
      // Vient juste d'être relâché ! C'est le moment de tirer.
      isFrontWhitePressed = false;
      
      // 1. On envoie l'impulsion de tir (true) avec la jauge chargée
      triggerLaunch = true;
      publishCurrentState();
      
      // 2. On remet tout à zéro immédiatement après pour le prochain tir
      triggerLaunch = false;
      simulatedPlunger = 0.0;
      publishCurrentState();
      
      lastPublishTime = now;
    } 
    else if (stateChanged) {
      // Si un AUTRE bouton a changé, on publie l'état normalement
      publishCurrentState();
    }
  }
}