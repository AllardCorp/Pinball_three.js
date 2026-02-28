# MVP — Pinball Three.js

## Problème & Utilisateur

Les passionnés de jeux d'arcade (comme le persona **Stéphanie**) veulent retrouver les sensations tactiles d'un vrai flipper. Le problème est que les machines physiques **coûtent cher** et sont **rares**, tandis que les jeux vidéo classiques manquent d'**immersion physique** et de **retours haptiques**.

---

## MVP (Minimum Viable Product)

1. **Playfield 3D jouable** — Gravité, collisions et batteurs fonctionnels, tournant sous **Three.js** et **Rapier**. Le Playfield est la **source de vérité du game state** :

- Il publie les événements (score, collisions, état de la partie) via MQTT.
- Les autres interfaces (Backglass, DMD) sont en lecture seule.

2. **Broker MQTT (Mosquitto)** — Assure la communication temps réel entre l’ESP32 et les différentes interfaces (Playfield, Backglass, DMD) via MQTT/WebSocket.
3. **Contrôles physiques** — Boutons des flippers gauche/droit et Start opérationnels via un **ESP32** communiquant en **MQTT**.
4. **Retour haptique** — Au moins un solénoïde physique qui claque lorsqu'une collision clé se produit dans la 3D.
5. **Sauvegarde du score** — En fin de partie (3 billes perdues), le score est enregistré.

---

## Critères de succès mesurables

| #   | Critère                   | Objectif                                                                                                                             |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Performance 3D**        | Le Playfield maintient un framerate constant de **60 FPS** pour une physique fluide et reproductible.                                |
| 2   | **Latence d'interaction** | L'actionnement d'un batteur 3D suite à l'appui sur un bouton physique est perçu comme **immédiat** (faible latence MQTT/WebSockets). |
| 3   | **Cohérence des données** | **Zéro désynchronisation** du score entre le Playfield et le Backglass sur une session complète de jeu.                              |

---

## Contraintes

- **Délai & Ressources** — Projet MVP à livrer en **4 semaines** environ avec une équipe de **4 personnes**.
- **Environnement matériel** — Le matériel existant (le meuble du flipper) ne doit subir **aucune modification irréversible** ou dégradation.
- **Logistique** — Le temps d'accès direct à la machine physique pour les tests finaux est **limité**.

---

## Top 3 Risques & Plans B

### Risque 1 — Intégration IoT trop complexe ou retardée

L'intégration IoT casse la jouabilité de la démo.

> **Plan B :** Activer le mode _Keyboard Fallback_ pour tout contrôler au clavier et isoler l'ESP32.

### Risque 2 — Effondrement des performances WebGL

La physique ou les graphismes font chuter les performances.

> **Plan B :** Optimiser massivement la scène — modèles **low-poly**, limitation des lumières dynamiques, simplification des _colliders_.

### Risque 3 — Désynchronisation des frontends

Les trois frontends (Playfield, Backglass, DMD), connectés au broker MQTT via **WebSocket**, se désynchronisent en pleine partie.

> **Plan B :** Mettre en place un "Game State Authority" unique (Playfield ou serveur) qui publie l’état complet du jeu, les autres frontends ne font que s’abonner.
