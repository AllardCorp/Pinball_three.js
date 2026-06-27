# Contrat gameplay futur

## Objet

Ce document transforme les notes de gameplay futur en contrat exploitable par l'équipe et par les IA.

Il sert à préparer :

- les futurs états du store frontend
- les événements envoyés au DMD
- les informations persistantes du backglass
- les tests attendus quand ces mécaniques seront codées

Il complète :

- [dmd-design-contract.md](./dmd-design-contract.md)
- [dmd-message-matrix.md](./dmd-message-matrix.md)
- [dmd-review-checklist.md](./dmd-review-checklist.md)

---

## Statut

Ce document décrit des intentions de gameplay.

Il ne signifie pas que les fonctionnalités existent déjà dans le code.

Règle stricte :

- une feature listée ici ne doit pas être affichée par le DMD tant qu'un signal source n'existe pas
- une IA ne doit pas hardcoder ces états dans un composant
- le playfield, la physique et le store restent les sources de vérité
- le DMD et le backglass restent des surfaces d'affichage

---

## Principes de modélisation

Chaque mécanique future doit être décrite avec :

- une zone du plateau
- un événement source
- une règle de scoring ou de multiplicateur
- une durée ou un cooldown si nécessaire
- un message DMD court
- un état backglass si l'information doit rester visible
- un test ciblé si une logique de priorité ou de calcul est introduite

Ne pas mélanger :

- collision physique
- règle de score
- affichage DMD
- affichage backglass

Ces quatre couches doivent rester séparées.

---

## Zones et mécaniques futures

| Mécanique | Zone / interaction | Règle gameplay | Message DMD réservé | Affichage backglass | Etat nécessaire | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| `light-road` | Courbe lumineuse | Chaque lumière activée donne des points. Toutes les lumières actives déclenchent `x2`. Les points sont attribués quand la bille quitte la courbe, puis les lumières reset. | `ROUTE ALLUMEE`, `RUNE ALLUMEE`, `X2 ACTIVE` | progression des lumières, multiplicateur `x2` | `lightRoadProgress`, `isBallOnLightRoad`, `lightRoadScoreBuffer` | A créer |
| `cannon-multiball` | Canon | Le canon envoie des billes sur le plateau. La multibille est limitée à 3 billes maximum. | `CANON ARME`, `MULTIBALL`, `3 BILLES` | nombre de billes actives, état multiball | `cannonReady`, `multiballActive`, `activeBallsCount` | A créer |
| `fakir-gates` | Sorties du fakir | Trois portes donnent des multiplicateurs différents : `x4`, `x6`, `x10`. | `PORTE X4`, `PORTE X6`, `PORTE X10` | multiplicateur actif et cooldown | `fakirGateMultiplier`, `multiplierSources` | A créer |
| `fakir-catacomb` | Porte à la sortie du fakir | La bille entre dans une porte type catacombe et ressort sous le canon avec une impulsion. | `CATACOMBES`, `RETOUR CANON` | état de tunnel / retour bille | `catacombActive`, `catacombExitReady` | A créer |
| `sun-bonus-zone` | Zone autour du soleil Dark Souls | Zone visuelle centrale liée au bonus soleil et au multiplicateur ultime. | `SOLEIL NOIR`, `X50 ACTIVE` | timer du bonus soleil, multiplicateur `x50` | `sunBonusActive`, `sunBonusEndsAt` | A créer |
| `right-fakir-rubber` | Rubber courbe droite côté fakir | Donne `1000` points et renvoie la bille. | `+1000`, `REBOND` | aucun affichage persistant requis | événement collision rubber | A créer |
| `mine-entry` | Entrée de la mine | Entrer dans la mine active un multiplicateur `x8`. | `MINE X8`, `ENTREE MINE` | multiplicateur `x8` et cooldown | `mineMultiplierActive`, `multiplierSources` | A créer |
| `gem-triple` | Trois gemmes / rubis | Activer les trois gemmes en même temps donne `x12`. Le comportement toggle doit être conservé. | `3 GEMMES`, `X12 ACTIVE` | état des trois gemmes, multiplicateur `x12` | `rubiesActive`, futur `gemMultiplierActive` | Partiel |
| `bumper-layout` | Bumpers | Déplacement physique envisagé par Amaury. | Aucun message DMD par défaut | aucun | décision layout / physique | A clarifier |

---

## Gestion des multiplicateurs

Règle métier :

- le multiplicateur le plus haut actif est toujours appliqué
- les multiplicateurs ne s'additionnent pas
- chaque multiplicateur possède son propre cooldown
- les timestamps doivent être comparés avec la clock Three.js
- si tous les multiplicateurs standards sont actifs en même temps, le bonus soleil déclenche `x50`

Multiplicateurs prévus :

| Multiplicateur | Source | Condition |
| --- | --- | --- |
| `x2` | Light road | toutes les lumières de la courbe sont activées |
| `x4` | Sortie fakir simple | porte la plus simple |
| `x6` | Sortie fakir intermédiaire | deuxième sortie du fakir |
| `x8` | Mine | entrée dans la mine |
| `x10` | Sortie fakir complexe | troisième sortie du fakir |
| `x12` | Trois gemmes | activation simultanée des trois gemmes |
| `x50` | Bonus soleil | tous les multiplicateurs standards actifs en même temps |

Contrat de state proposé :

```ts
type MultiplierId =
  | "light-road-x2"
  | "fakir-x4"
  | "fakir-x6"
  | "mine-x8"
  | "fakir-x10"
  | "gems-x12";

type TimedMultiplier = {
  id: MultiplierId;
  value: 2 | 4 | 6 | 8 | 10 | 12;
  activatedAt: number;
  expiresAt: number;
  isActive: boolean;
};

type MultiplierState = {
  activeMultipliers: TimedMultiplier[];
  currentMultiplier: 1 | 2 | 4 | 6 | 8 | 10 | 12 | 50;
  sunBonusActive: boolean;
  sunBonusExpiresAt: number | null;
};
```

Le DMD ne doit pas recalculer ces règles.

Il doit seulement recevoir ou lire :

- le multiplicateur courant
- la source du dernier multiplicateur activé
- l'état du bonus soleil
- le temps restant si nécessaire

---

## Bonus soleil

Condition :

- tous les multiplicateurs standards sont actifs en même temps

Effets gameplay prévus :

- activation pendant une durée limitée
- multiplicateur `x50`
- activation du mode `undeath`
- le trou entre les flippers est comblé pendant le bonus

Effets visuels prévus :

- activation visuelle du soleil
- tornade eau + feu au centre du plateau
- pas d'effet direct sur la trajectoire de la bille

Messages DMD réservés :

- `SOLEIL NOIR`
- `X50 ACTIVE`
- `UNDEATH`
- `DRAIN SCELLE`

Etat nécessaire :

```ts
type SunBonusState = {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  undeathActive: boolean;
};
```

Priorité DMD recommandée :

- activation : `P1`
- fin du bonus : `P1`
- timer ou état persistant : backglass plutôt que DMD

---

## Gestion des classes

Règle générale :

- il n'y a pas de classe par défaut
- chaque classe possède une zone de prédisposition
- chaque classe possède une compétence
- une épée spawn aléatoirement sur le plateau
- quand la bille touche l'épée, une classe est choisie aléatoirement
- les personnages peuvent avoir un effet de glowing lors de la sélection

Etat nécessaire :

```ts
type PlayerClassId = "necromancer" | "dwarf" | "warrior" | "elf";

type ClassState = {
  activeClass: PlayerClassId | null;
  swordSpawnPosition: string | null;
  classSelectionInProgress: boolean;
  lastClassActivatedAt: number | null;
};
```

---

## Classes prévues

| Classe | Zone de prédisposition | Compétence | Message DMD réservé | Etat nécessaire |
| --- | --- | --- | --- | --- |
| `Nécromancien` | Cimetière | Bille supplémentaire qui sort du cimetière. Peut déclencher une multibille. | `NECROMANCIEN`, `BILLE RELEVE` | `activeClass`, `graveyardBallReady`, `activeBallsCount` |
| `Nain` | Mine | Multiplicateur `x12` activable. Les planches de la mine se cassent. | `NAIN`, `MINE OUVERTE`, `X12 ACTIVE` | `activeClass`, `mineBoardsBroken`, `gemMultiplierActive` |
| `Guerrier` | Tonneau / bumpers | Peut donner une impulsion à la mine. | `GUERRIER`, `IMPACT MINE` | `activeClass`, `mineImpulseReady` |
| `Elfe` | Lumière de la courbe | Active un multiplicateur manquant. | `ELFE`, `RUNE OFFERTE` | `activeClass`, `missingMultiplierGranted` |

---

## Répartition DMD / backglass

Le DMD doit afficher :

- activation de classe
- activation de multiplicateur
- bonus soleil
- multibille
- score court
- feedback de collision important

Le backglass doit afficher :

- multiplicateur courant
- cooldowns actifs
- classe active
- progression light road
- état des gemmes
- nombre de billes actives
- timer du bonus soleil

Le DMD ne doit pas afficher :

- la liste complète des cooldowns
- un arbre de compétences
- un inventaire de classe
- une explication longue du bonus soleil
- une carte détaillée des zones du plateau

---

## Messages DMD réservés

Ces messages sont réservés pour les futures features.

Ils ne doivent pas être branchés tant que la mécanique source n'existe pas.

| Message | Priorité | Condition |
| --- | --- | --- |
| `ROUTE ALLUMEE` | P2 | progression light road |
| `X2 ACTIVE` | P1 | light road complète |
| `CANON ARME` | P2 | canon prêt |
| `MULTIBALL` | P1 | multibille active |
| `3 BILLES` | P1 | trois billes actives |
| `PORTE X4` | P2 | sortie fakir x4 |
| `PORTE X6` | P2 | sortie fakir x6 |
| `PORTE X10` | P2 | sortie fakir x10 |
| `CATACOMBES` | P2 | entrée porte fakir |
| `RETOUR CANON` | P2 | sortie sous le canon |
| `MINE X8` | P1 | entrée mine |
| `3 GEMMES` | P1 | activation simultanée des gemmes |
| `X12 ACTIVE` | P1 | multiplicateur x12 |
| `SOLEIL NOIR` | P1 | bonus soleil déclenché |
| `X50 ACTIVE` | P1 | multiplicateur ultime |
| `UNDEATH` | P1 | mode drain bloqué |
| `NECROMANCIEN` | P1 | classe sélectionnée |
| `NAIN` | P1 | classe sélectionnée |
| `GUERRIER` | P1 | classe sélectionnée |
| `ELFE` | P1 | classe sélectionnée |

---

## Gaps à traiter avant implémentation

Avant de coder ces features, il faut clarifier :

- la durée exacte des multiplicateurs
- la durée exacte du bonus soleil
- les positions possibles de spawn de l'épée
- le nombre exact de lumières de la light road
- le fonctionnement précis du reset light road
- la condition exacte de multibille via canon
- l'ordre de priorité entre classe, multiplicateur et multibille
- le format des événements envoyés au DMD
- la séparation entre événements physiques et événements gameplay

---

## Tests attendus à terme

Quand ces features seront implémentées, prévoir des tests pour :

- appliquer uniquement le multiplicateur actif le plus haut
- expirer chaque multiplicateur indépendamment
- déclencher `x50` quand tous les multiplicateurs standards sont actifs
- désactiver `x50` à la fin du bonus soleil
- empêcher plus de 3 billes actives en multibille
- sélectionner une classe sans classe par défaut
- vérifier qu'une classe produit uniquement ses effets autorisés
- vérifier que le DMD n'affiche pas un message réservé sans état source
- vérifier que le backglass affiche les cooldowns sans surcharger le DMD

---

## Règle pour les prochaines IA

Avant d'implémenter une feature de ce document, une IA doit d'abord répondre à ces questions :

- quel état source existe déjà ?
- quel état manque ?
- quelle partie appartient au playfield ?
- quelle partie appartient au store ?
- quelle partie appartient au DMD ?
- quelle partie appartient au backglass ?
- quel test protège la règle ?

Si ces réponses ne sont pas claires, la bonne action est de compléter le contrat ou de proposer un mini design technique, pas de coder directement dans l'interface.
