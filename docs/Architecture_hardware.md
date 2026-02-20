# Proposition d'Architecture Matérielle : Gestion Universelle des Inputs (Raspberry Pi)

## Vision Globale
L'enjeu de ce projet commun est qu'il n'y a qu'un seul flipper physique pour plusieurs groupes aux implémentations logicielles différentes. Notre architecture propose un module de gestion des entrées (Inputs) **totalement agnostique et universel**, centré autour d'un **Raspberry Pi**. 
L'objectif est d'offrir une "latence zéro" et une intégration "Plug & Play", peu importe la technologie ou la logique de Playfield choisie par le groupe qui déploie son code.

---

## 1. Blocs de l'Architecture (Flux global)

Le flux respecte la chaîne complète demandée, mais isole totalement la responsabilité des entrées :

* **Capteurs (Inputs) :** Les composants physiques du "meuble" (Micro-switchs des batteurs, boutons, monnayeurn Nudge...).
* **Traitement (Le cœur de notre proposition) :** Un **Raspberry Pi** dédié. Il lit les signaux électriques GPIO, filtre les faux-contacts (debounce) et traduit ces signaux électriques en commandes informatiques universelles.
* **Communication (Interface Universelle) :** Le protocole de transmission. Côté Inputs, le Raspberry Pi émule un clavier USB (HID). Côté Outputs/Serveur, on utilise du MQTT standard.
* **Action (Outputs - Boîte noire) :** Les relais de puissance et les 10 solénoïdes. Ils sont pilotés par le raspberry pi séparé qui écoute simplement les ordres MQTT du serveur.
* **UI / Stockage (Boîtes noires) :** Le Playfield (PC 1), le Backglass/DMD et la BDD PostgreSQL. Grâce à notre émulation clavier, l'UI n'a besoin d'aucune configuration IoT complexe : elle écoute simplement les événements standards du navigateur (`keydown`).

---

## 2. Interfaces entre les blocs (Format / Protocole / Fréquence)

L'interface que nous proposons garantit que n'importe quel groupe pourra se brancher sur notre système sans réécrire son code :

* **Capteurs ➔ Traitement (Raspberry Pi)**
    * *Format :* Signaux électriques bruts (High/Low).
    * *Protocole :* Lecture matérielle des **GPIO**.
    * *Fréquence :* Continue (Polling haute fréquence pour une latence < 1ms).
* **Traitement (Raspberry Pi) ➔ UI Playfield (PC)**
    * *Format :* Frappes de touches natives (ex: 'X' = flipper gauche, 'C' = flipper droit).
    * *Protocole :* **HID (Human Interface Device) via USB** ou noyau OS.
    * *Fréquence :* Instantanée.
* **Communication ➔ Action (Solénoïdes)**
    * *Format / Protocole :* JSON léger via **MQTT**. (ex: `{"solenoid": "left_bumper", "state": "on"}`).

---

## 3. Trois décisions techniques justifiées

**1. Le Raspberry Pi comme émulateur de clavier universel (HID)**
* *Justification :* C'est le point fort de notre architecture. Au lieu d'obliger chaque groupe à intégrer des librairies IoT complexes (MQTT/Serial) directement dans leur code frontend Three.js, notre Raspberry Pi agit au niveau de l'OS (via un script Python utilisant `uinput`). Il transforme l'appui du bouton physique en une vraie frappe de touche (X, C, D). **Résultat : n'importe quel Playfield web fonctionnera instantanément avec notre borne**, car tous les navigateurs web savent lire un événement `window.addEventListener('keydown')`.

**2. Le "Software Debounce" exécuté sur le Raspberry Pi**
* *Justification :* Les boutons d'arcade physiques génèrent du "bruit" électrique (rebonds). Si l'on envoie ce bruit brut au Playfield, la physique de la bille va bugger (batteurs qui tremblent). Le Raspberry Pi possède la puissance de calcul nécessaire pour appliquer un filtre temporel logiciel (ignorer les variations de moins de 5ms) avant de déclencher la frappe clavier. On garantit ainsi une donnée "propre" à l'UI, déchargeant le Playfield de ce calcul.

**3. Découplage strict et asymétrique des Inputs et Outputs**
* *Justification :* Pour que l'architecture soit maintenable, nous séparons les Inputs (connexion filaire/clavier directe pour une latence zéro sur les batteurs) et les Outputs (connexion sans-fil MQTT pour les solénoïdes). Cette asymétrie protège le gameplay : même si le serveur central d'un groupe crashe ou que le Wi-Fi ralentit, les flippers physiques continueront de réagir instantanément grâce à la liaison clavier directe du Raspberry Pi.