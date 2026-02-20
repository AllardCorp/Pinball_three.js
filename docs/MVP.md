# MVP — Pinball Three.js

## Problème & Utilisateur

Les passionnés de jeux d'arcade (comme le persona **Stéphanie**) veulent retrouver les sensations tactiles d'un vrai flipper. Le problème est que les machines physiques **coûtent cher** et sont **rares**, tandis que les jeux vidéo classiques manquent d'**immersion physique** et de **retours haptiques**.

---

## MVP (Minimum Viable Product)

1. **Playfield 3D jouable** — Gravité, collisions et batteurs fonctionnels, tournant sous **Three.js** et **Rapier**.
2. **Serveur Node.js** — Centralise la logique et synchronise en temps réel le Playfield avec un écran Backglass (affichage du score) via **WebSockets**.
3. **Contrôles physiques** — Boutons des flippers gauche/droit et Start opérationnels via un **ESP32** communiquant en **MQTT**.
4. **Retour haptique** — Au moins un solénoïde physique qui claque lorsqu'une collision clé se produit dans la 3D.
5. **Sauvegarde du score** — En fin de partie (3 billes perdues), le score est enregistré.

---

## Critères de succès mesurables

| # | Critère | Objectif |
|---|---------|----------|
| 1 | **Performance 3D** | Le Playfield maintient un framerate constant de **60 FPS** pour une physique fluide et reproductible. |
| 2 | **Latence d'interaction** | L'actionnement d'un batteur 3D suite à l'appui sur un bouton physique est perçu comme **immédiat** (faible latence MQTT/WebSockets). |
| 3 | **Cohérence des données** | **Zéro désynchronisation** du score entre le Playfield, le Serveur et le Backglass sur une session complète de jeu. |

---

## Contraintes

- **Délai & Ressources** — Projet MVP à livrer en **4 semaines** environ avec une équipe de **4 personnes**.
- **Environnement matériel** — Le matériel existant (le meuble du flipper) ne doit subir **aucune modification irréversible** ou dégradation.
- **Logistique** — Le temps d'accès direct à la machine physique pour les tests finaux est **limité**.

---

## Top 3 Risques & Plans B

### Risque 1 — Intégration IoT trop complexe ou retardée

L'intégration IoT casse la jouabilité de la démo.

> **Plan B :** Activer le mode *Keyboard Fallback* pour tout contrôler au clavier et isoler l'ESP32.

### Risque 2 — Effondrement des performances WebGL

La physique ou les graphismes font chuter les performances.

> **Plan B :** Optimiser massivement la scène — modèles **low-poly**, limitation des lumières dynamiques, simplification des *colliders*.

### Risque 3 — Désynchronisation des frontends

Les trois frontends (Playfield, Backglass, DMD), connectés au serveur via **WebSockets**, se désynchronisent en pleine partie.

> **Plan B :** Remplacer la communication WebSocket par le **state manager** de l'application Next.js pour synchroniser directement l'état du jeu entre les différentes pages.
