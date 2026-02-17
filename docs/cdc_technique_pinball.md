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
Afin de garantir une base de code saine et une collaboration fluide, l'équipe s'engage à respecter les règles suivantes :

### **Gestion des Branches**

Le nommage des branches suit la structure : `type/id-issue-slug` (ex: `feature/42-physics-engine`).

*   **Types autorisés** : `main` (production), `feature/` (nouvelle fonctionnalité), `bugfix/` (correction), `hotfix/` (urgence), `release/` (préparation version), ou `docs/` (maintenance/docs).
*   **Règles de formatage** : Minuscules uniquement, chiffres et tirets autorisés. Pas de tirets ou points consécutifs, ni au début/fin du nom.

**Workflow des branches**

Nous utilisons une branche de transition pour garantir la stabilité du projet :

*   **Branche `develop`** : C'est la branche d'intégration principale. Toutes les fonctionnalités y sont regroupées pour les tests.
*   **Branche `main`** : Branche de production. On n'y merge `develop` qu'après s'être assuré de la stabilité globale du projet.
*   **Cycle de vie** : `feature/*` ➔ merge dans `develop` ➔ tests de stabilité ➔ merge final dans `main`.

### **Convention des Commits**

Nous utilisons les **Conventional Commits** pour faciliter la lecture de l'historique :

*   **Format** : `<type>: <description>` (ex: `feat: add rapier collision detection`).
*   **Types principaux** : `feat` (nouveau), `fix` (correctif), `docs` (documentation), `style` (formatage), `refactor` (code), `test` (tests).

### **Workflow de Pull Request (PR)**

*   **Cible par défaut** : Toute modification du code doit passer par une PR ciblée vers la branche `develop`.
*   **Validation** : Chaque PR nécessite au minimum **1 review approuvée**.
*   **Pair Review** : Pour favoriser la montée en compétence, les PR complexes sont revues en direct lors des Daily meetings.

### **Gestion des Conflits**

*   **Prévention** : Avant de soumettre une PR, l'auteur doit effectuer un `rebase` sur `develop` (et non directement sur `main`) pour intégrer les derniers changements des autres membres.
*   **Résolution** : Les conflits critiques sont résolus en binôme (auteur + reviewer) pour garantir l'intégrité du code fusionné.
---

## **Roadmap et questions ouvertes**
