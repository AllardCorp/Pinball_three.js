# ROADMAP

Notre état actuel du projet (16/02/2026)
* La V1 du cahier des charges terminée
* Le but sera **d'assurer les fonctionnalités de base** (playfield 3D + physique + contrôleurs + backglass + DMD + sync temps réel + gestion événements + documentation) pour le reste des semaines. 
* Nous avons environs **6 semaines de cours** 


## Resumer

* **M0 - Setup & contrat** : Cahier des charges et infrastructure
* **M1 - Vertical slice** : 1 balle + 2 flippers + 1 bumper + score + DMD/backglass synchronisés
* **M2 - Gameplay base** : trous, game over, ball count, start/coin, scoring propre
* **M3 - Robustesse & multi-machines** : reconnexion, resync, performance stable
* **M4 - IoT** : intégration contrôleurs (X/C/D/F) + solénoïdes en mode safe
* **M5 - Livraison** : doc UML/archi, vidéo 2–3 min, répétition soutenance

---

## Semaine par semaine (pendant les 6 semaines de cours)

### S1 - M0 : fondations (objectif : “ça tourne partout”)

**Livrable fin S1 (semaine actuelle)**

* Cahier des charges
* Monorepo ou 3 apps + package commun
* Broker (Mosquitto/Aedes) + client MQTT/WS
* **Playfield** minimal (scène R3F + Rapier) qui tourne (sans gameplay complet)

### S2 - M1 : vertical slice jouable (le plus important)

**Livrable fin S2**

* **DMD** qui reçoit un event “scoreAdded” et affiche le score
* Balle dynamique + table + **1 bumper** + 2 flippers clavier (X/C en local si possible)
* Collision bumper → event envoyé → score mis à jour sur Backglass + DMD
* Début d’un “game state” simple : `idle → playing`

### S3 - M2 : gameplay base

**Livrable fin S3**

* Trous (ball lost), remise en jeu, compteur de billes
* Start (D), coin (F) si vous voulez simuler la séquence
* Messages DMD : “GAME OVER”, “100 POINTS”
* Backglass : score + animation basique (même simple)

### S4 - M3 : stabilité, sync, perf (vous sécurisez la note)

**Livrable fin S4**

* Fix timestep + CCD sur la balle, collisions stables (pas de tunneling)
* Reconnexion réseau : backoff + resync (snapshot)
* Multi-machines : Playfield / Backglass / DMD lancés sur 3 machines (au moins une fois)
* Logs d’events (utile pour debug)

### S5 - M4 : IoT (minimum viable + safe)

**Livrable fin S5**

* Contrôleurs IoT → entrées clavier X/C/D/F OK 
* Solénoïdes : intégration **safe** (pulse max + cooldown côté contrôleur)
* Mapping : quels events déclenchent quels solénoïdes (ex : bumper_hit → solénoïde #3)

### S6 - M5 : consolidation + doc “notable”

**Livrable fin S6**

* “Demo flow” stable (partie complète sans crash)
* **README installation + schéma archi + explications choix techniques** 
* 1er jet UML (au moins : séquence events + composants)
* Liste des risques/contraintes finalisée
