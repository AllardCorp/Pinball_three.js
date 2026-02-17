# Cahier des charges Technique pour le projet de Pinball

**Auteur**: [Adrien Allard, Stéphane Descarpentries]


---

## **Vision**

---

## **Objectifs et perimetre**

---

## **Use cases**

---

## **Architecture technique**

<!-- link image -->
![Architecture technique](assets/architecture_technique.png)
### **Cœur du Système**

*   **Serveur Central (Node.js/WS)** : Il agit comme le "chef d'orchestre" et le pont (bridge) entre tous les composants. Il centralise les événements et synchronise les applications en temps réel.

### **Interfaces Utilisateurs (Frontend)**
**Écrans de jeu (via WebSockets)** :
*   **Playfield (R3F + Rapier)** : Gère la simulation physique 3D et le rendu de la table.
*   **Backglass (Next.js/Canvas)** : Affiche le score et les animations thématiques.
*   **DMD (Next.js/HTML)** : Affiche les messages textuels et les scores en style rétro**Accès Distant (via HTTP/WS)** :
*   **Mobile (Client)** : Permet l'authentification et le login à distance pour démarrer la partie.

### **Partie Matérielle (IoT)**

**Communication Réseau (via MQTT / Broker Mosquitto)** :
*   L'ESP32 reçoit et envoie les données de contrôle au serveur central avec une latence minimale.

**Contrôle Physique (via Liaison Serial)** :
*   L'ESP32 est relié directement aux Contrôleurs pour détecter l'appui sur les boutons (flippers, start) et actionner les solénoïdes pour le retour haptique.

## **Diagrammes UML**

---

## **Stack technique**

---

## **Risques et contraintes**

---

## **Conventions equipe**

---

## **Roadmap et questions ouvertes**
