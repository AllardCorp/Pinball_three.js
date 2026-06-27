# Contrat de design DMD

## Objet

Ce document fixe la direction visuelle du DMD du projet `Pinball Three.js`.

Le but est double :

- garantir une identité cohérente avec le thème `Donjons & Dragons`
- éviter les dérives vers une interface générique, trop moderne, ou visuellement confuse

Ce document ne décrit pas encore les messages exacts ni leur logique de priorité.
Il décrit uniquement le **langage visuel** du DMD.

---

## Rôle du DMD

Le DMD est un **affichage de signalétique de jeu**.
Il doit rester :

- lisible à distance
- rapide à comprendre
- visuellement distinct du backglass
- fidèle à l'ADN d'un écran de flipper

Le DMD n'est pas :

- un dashboard complet
- un menu RPG
- un panneau de statistiques détaillé
- un support pour de longs textes narratifs

Le DMD affiche en priorité :

- score
- joueur actif
- bille en cours / état de partie
- événements de gameplay
- états spéciaux courts

Le DMD n'affiche pas en priorité :

- QR code
- panneaux complexes
- textes de lore longs
- informations secondaires persistantes

Ces éléments relèvent plutôt du backglass.

---

## Direction retenue

La direction officielle du DMD est :

`runique arcade` + `codex de campagne`

Cela signifie :

- base d'affichage issue du flipper : score massif, lisibilité forte, densité contrôlée
- habillage D&D par la matière, les cadres, les runes, les sceaux et le ton narratif

Le DMD doit ressembler à :

- une plaque d'affichage de flipper
- renforcée par une esthétique de relique draconique ou de codex mystique
- construite comme une interface médiévale équipée de petites diodes lumineuses

Le DMD ne doit pas ressembler à :

- une UI de jeu vidéo fantasy complète
- un HUD néon générique
- une interface "AI slop" avec verre fumé, glow partout et surcharge d'ornements

---

## Principes visuels

### 1. Lisibilité avant décor

Chaque décision visuelle doit préserver la lecture immédiate du message principal.

Ordre de priorité :

1. information critique
2. hiérarchie visuelle
3. ambiance thématique
4. décoration

### 2. Le thème passe par le framing, pas par la surcharge

Le style D&D doit s'exprimer surtout par :

- les cadres
- les angles
- les séparateurs
- les icônes
- les sceaux
- la matière

et non par :

- des illustrations de fond omniprésentes
- des glyphes partout
- des effets lumineux continus

### 3. Un affichage de flipper reste un affichage de flipper

Le DMD doit conserver une sensation d'affichage dédié :

- frontal
- dense
- direct
- rythmé
- très contrasté

Il ne doit pas dériver vers une page d'application web.

---

## Palette

### Couleurs principales

- `obsidienne` : `#0f0d0c`
- `charbon` : `#1b1715`
- `ivoire chaud` : `#e6dcc8`
- `ambre` : `#d78a1f`
- `laiton terni` : `#8a6a2f`

### Accents lumineux

Les accents lumineux doivent être traités comme des diodes, pas comme du néon.

Accents autorisés :

- `diode ambre` : `#d99a3a`
- `diode ivoire` : `#f1d08a`
- `rouge braise` : `#7b2d20`

### Règles

- le fond reste sombre en permanence
- les informations critiques utilisent un contraste fort
- les lumières doivent ressembler à des diodes incrustées dans une plaque médiévale
- les accents froids type cyan, bleu ou vert néon sont interdits pour le thème D&D actuel
- il ne faut jamais multiplier plusieurs lueurs concurrentes sur le même écran

---

## Matières et textures

Le DMD doit évoquer :

- pierre noire polie
- fer forgé
- laiton ou bronze usé
- sceaux gravés
- diodes lumineuses incrustées
- plaque de score mécanique ou arcade médiévale

Textures autorisées :

- grain léger
- trame DMD
- grille de diodes discrète
- très faible usure de surface

Textures interdites :

- bruit fort
- métal brillant moderne
- verre translucide type HUD futuriste
- arrière-plan illustré détaillé derrière l'information

---

## Formes et framing

Le framing doit utiliser :

- plaques rectangulaires biseautées
- séparateurs métalliques gravés
- coins décorés
- médaillons ou sceaux pour les états spéciaux

Le framing ne doit pas :

- manger la surface utile
- créer des zones mortes trop larges
- imposer une symétrie décorative plus importante que le contenu

Règle pratique :

- le décor habille les bords
- le centre reste prioritairement au service du message

---

## Typographie

### Titres et événements

Les titres peuvent utiliser une typographie fantasy :

- massive
- simple
- à fort caractère
- lisible en très peu de mots

### Score et données

Le score, les numéros de joueur, les billes et les valeurs doivent utiliser une typographie :

- simple
- stable
- géométrique ou quasi industrielle
- très lisible à distance

### Interdictions

- pas de calligraphie décorative sur les chiffres
- pas de police trop étroite
- pas de police trop fine
- pas de style "manuscrit" pour l'information gameplay

---

## Composition

Répartition cible :

- `70%` information utile
- `20%` framing et ambiance
- `10%` accent ou effet spécial

Hiérarchie attendue :

- ligne ou zone principale : score ou message central
- ligne secondaire : contexte (`PLAYER`, `BALL`, `MODE`)
- ligne tertiaire : statut court ou callout contextuel

Le DMD doit privilégier :

- des messages courts
- une hiérarchie évidente
- des blocs bien séparés

Le DMD doit éviter :

- les grilles complexes
- les micro-labels
- la multiplication de sous-zones permanentes

---

## Format d'écran cible

Le DMD physique cible un viewport `1920x1080`.

La géométrie complète fournie pour la borne est :

- taille : `1920x1080`
- position écran : `+240,1080`

Règles d'implémentation :

- React et CSS doivent viser un affichage plein viewport en ratio `16:9`
- la page DMD ne doit pas créer de scroll en `1920x1080`
- le panneau DMD doit exploiter presque toute la largeur utile, avec une marge de sécurité
- la position `+240,1080` relève du lancement navigateur / kiosk / OS, pas du composant React
- le composant doit rester responsive pour le développement local, mais l'arbitrage visuel se fait sur `1920x1080`

---

## Rendu par diodes

Le DMD doit être rendu comme une vraie matrice de diodes.

Cela signifie :

- le texte visible doit être composé de diodes allumées
- les silhouettes et scènes attract doivent être composées de diodes allumées
- les diodes éteintes doivent rester visibles en fond
- il ne faut pas poser du texte HTML par-dessus une simple texture pointillée
- il ne faut pas créer une `div` par diode

La stratégie retenue est :

- un seul canvas pour le rendu visuel
- une résolution logique basse, par exemple `192x64`
- un upscale vers le viewport `1920x1080`
- une animation pilotée par `requestAnimationFrame`
- des scènes simples et peu coûteuses

Le canvas peut afficher :

- score live
- messages courts
- texte défilant droite vers gauche
- silhouette fantasy en diodes
- scène attract médiévale en diodes

---

## Iconographie

Icones autorisées :

- rune
- œil draconique
- bouclier
- lame
- flamme
- crâne
- sceau
- relique

Règles :

- icônes compactes
- lecture immédiate
- peu nombreuses
- jamais en concurrence avec le score

L'iconographie doit soutenir le message, pas le remplacer.

---

## Animation

Animations autorisées :

- pulsation légère de diode
- flash d'impact
- balayage de braise
- clignotement bref de sceau
- transition courte entre deux états

Animations interdites :

- mouvement permanent de fond
- pluie d'effets
- particules continues
- glow vivant sur toute l'interface
- effets "sci-fi HUD"
- halo néon bleu, cyan ou vert

Règle :

- une animation doit servir un événement
- si aucun événement n'a lieu, l'écran doit rester stable

---

## États émotionnels visuels

Le DMD peut changer légèrement de ton selon l'événement :

- `jeu normal` : sobre, ambre + ivoire
- `objectif / quête` : diode ambre ou ivoire renforcée
- `danger / tilt / boss` : contraste plus dur, accent agressif
- `game over` : ambiance plus lourde, braise faible, relique assombrie

Ces variations doivent rester dans le même système visuel.

---

## Architecture multi-thème

Le DMD doit être conçu comme une surface réutilisable.

Le thème `Donjons & Dragons` est le premier thème officiel, mais il ne doit pas être codé en dur dans la page route.

Structure recommandée :

- `frontend/src/pages/DMD.tsx` : branchement aux stores, hooks et choix du thème actif
- `frontend/src/components/dmd/DungeonDragonDmdDisplay.tsx` : rendu canvas spécifique Donjons & Dragons
- `frontend/src/lib/dmd-messages.ts` : logique pure de sélection et formatage des messages
- `frontend/src/tests/dmd-messages.test.ts` : tests de la logique de messages

Le composant `DungeonDragonDmdDisplay` doit recevoir des données prêtes à afficher.

Il ne doit pas :

- lire directement toute la logique de gameplay
- recalculer les règles de score
- connaître les détails physiques du plateau
- inventer des états de jeu qui n'existent pas

Le thème peut définir :

- palette
- libellés courts de framing
- classes Tailwind de surface
- classes Tailwind de texte
- style des accents
- type d'ornement visuel

Le thème ne doit pas définir :

- règles de scoring
- priorités DMD
- durée des messages
- état de partie
- logique de multibille ou multiplicateur

Exemple d'intention :

```tsx
<DungeonDragonDmdDisplay viewModel={dmdViewModel} />
```

Cette séparation doit permettre d'ajouter plus tard un composant `MarioDmdDisplay`, `SciFiDmdDisplay` ou autre sans réécrire la logique commune de message.

---

## Anti-patterns

Les propositions suivantes doivent être refusées :

- faux HUD fantasy moderne bleu/violet
- verre fumé, néons, transparence inutile
- cyan, vert ou bleu lumineux sur le thème D&D actuel
- fond illustré ultra détaillé sous les infos critiques
- abondance de runes/glyphes/lueurs simultanées
- police fantasy utilisée partout
- cadre décoratif plus fort que le contenu
- composition rappelant une interface d'application web ou de dashboard

---

## Résumé exécutable

Si une future implémentation doit respecter ce contrat, elle doit pouvoir se résumer ainsi :

> Un DMD de flipper sombre, lisible et frontal, habillé comme une relique draconique ou un panneau de codex, avec une hiérarchie arcade claire et des accents fantasy rares mais significatifs.

---

## Statut

Version : `v1`

Ce document est la base pour :

- [dmd-message-matrix.md](./dmd-message-matrix.md)
- [dmd-review-checklist.md](./dmd-review-checklist.md)
- [gameplay-future-contract.md](./gameplay-future-contract.md)
