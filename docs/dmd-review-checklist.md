# Checklist de revue DMD

## Objet

Ce document sert de garde-fou pour toute future modification du DMD.

Il doit être utilisé :

- avant de demander une implémentation à une IA
- pendant une revue de pull request
- avant de merger une modification liée au DMD
- après une refonte visuelle ou fonctionnelle du DMD

Il complète :

- [dmd-design-contract.md](./dmd-design-contract.md)
- [dmd-message-matrix.md](./dmd-message-matrix.md)
- [gameplay-future-contract.md](./gameplay-future-contract.md)

Le but est d'éviter trois dérives :

- une interface générique qui ne ressemble pas à un DMD de flipper
- des messages inventés sans source dans l'état du jeu
- des tests superficiels qui valident seulement que le composant se rend

---

## Décision de revue

Une modification DMD peut être acceptée seulement si :

- elle respecte le contrat visuel
- elle respecte la matrice de messages
- elle ne transforme pas le DMD en dashboard
- elle s'appuie sur des signaux existants ou documente explicitement les signaux manquants
- elle ajoute des tests ciblés dès qu'il y a une logique de priorité, formatage ou sélection de message

Décision recommandée :

| Résultat | Condition |
| --- | --- |
| `Accepté` | Tous les contrôles bloquants sont validés et les écarts mineurs sont documentés |
| `Changements demandés` | Le fond est correct, mais il manque un test, une justification ou un ajustement de lisibilité |
| `Refusé` | Le DMD devient une UI générique, invente de l'état, ou casse la séparation DMD / backglass |

---

## Contrôles bloquants

Refuser la modification si au moins un point est vrai :

- le DMD contient un QR code ou une vue détaillée de score-claim
- le DMD réimplémente des règles de jeu, de scoring ou de physique
- le DMD invente des crédits, un tilt, un état IoT ou un jackpot sans état source
- le DMD affiche plusieurs messages concurrents sans priorité claire
- le DMD duplique toute la densité du backglass
- le message principal n'est pas lisible rapidement à distance
- le style visuel ressemble à un dashboard web moderne
- la modification ajoute une dépendance lourde pour un simple effet visuel
- une logique non triviale est ajoutée sans test ciblé

---

## Revue visuelle

Le DMD doit conserver :

- un fond sombre permanent
- une hiérarchie très lisible
- un score ou message principal dominant
- une esthétique `runique arcade` + `codex de campagne`
- une interface médiévale avec diodes lumineuses incrustées
- des effets rares, courts et liés à un événement de jeu

Points à vérifier :

- le centre reste dédié à l'information utile
- les bordures décoratives ne prennent pas trop de place
- les couleurs restent dans la palette définie
- les lumières ressemblent à des diodes chaudes, pas à du néon
- les accents cyan, bleu ou vert néon sont absents du thème D&D
- les chiffres restent simples et lisibles
- les polices fantasy ne sont utilisées que pour les titres ou événements courts
- les animations restent légères et peu coûteuses

Refuser les styles suivants :

- glassmorphism
- cartes SaaS
- violet / bleu néon générique
- cyan ou vert lumineux type HUD fantasy moderne
- fond fantasy illustré trop détaillé
- particules permanentes
- runes ou glyphes partout
- police médiévale illisible pour les scores

---

## Revue format écran

La cible borne du DMD est `1920x1080`.

Points à vérifier :

- la page DMD occupe un viewport complet sans scroll
- le rendu principal conserve un ratio `16:9`
- le contenu reste lisible en plein écran Full HD
- le composant ne dépend pas de la position OS `+240,1080`
- le placement de fenêtre est géré hors React, par la commande de lancement ou le mode kiosk

Refuser la modification si :

- elle hardcode `+240,1080` dans le composant React
- elle force une taille qui casse le développement local
- elle ajoute du scroll vertical sur un écran `1920x1080`
- elle réduit le DMD à une carte trop petite au centre de l'écran

---

## Revue rendu par diodes

Le DMD doit être rendu comme une matrice de diodes.

Points à vérifier :

- le texte visible est dessiné par des diodes allumées
- les scènes attract sont dessinées par des diodes allumées
- les diodes éteintes restent visibles en fond
- le rendu visuel principal utilise un canvas unique
- aucune grille massive de `div` n'est créée pour représenter les diodes
- les animations passent par `requestAnimationFrame`, pas par des re-renders React continus

Refuser la modification si :

- elle pose du texte HTML au-dessus d'une texture pointillée
- elle crée un élément DOM par diode
- elle multiplie les fichiers de scène sans nécessité
- elle fait dépendre le rendu DMD d'un état gameplay inventé
- elle remplace les diodes par un simple masque CSS statique

---

## Revue architecture multi-thème

La modification doit conserver une séparation claire entre page, composant, thème et logique.

Structure attendue :

- `DMD.tsx` orchestre les données et choisit le thème
- `DungeonDragonDmdDisplay.tsx` rend le canvas spécifique Donjons & Dragons
- `dmd-messages.ts` contient la logique pure de message

Points à vérifier :

- le thème D&D n'est pas codé en dur dans toute la page
- un futur thème `Mario` ou autre pourrait être ajouté sans réécrire la logique de message
- les règles de score et de priorité ne sont pas stockées dans le composant canvas
- le composant d'affichage ne lit pas directement tout le store si la page peut lui passer des données préparées
- les classes Tailwind restent lisibles et ne masquent pas une logique métier

Refuser la modification si :

- le composant mélange rendu, règles de gameplay et thème
- les textes D&D sont dispersés dans plusieurs composants sans matrice
- un nouveau thème oblige à dupliquer toute la page DMD
- le thème contient des valeurs factices de gameplay

---

## Revue des messages

Chaque message doit répondre à ces questions :

- quelle est sa source de vérité ?
- quelle est sa priorité ?
- combien de temps reste-t-il affiché ?
- peut-il interrompre un autre message ?
- doit-il être remplacé par un message plus prioritaire ?

Le texte doit être :

- court
- actionnable
- lisible en moins d'une seconde
- cohérent avec le vocabulaire flipper
- cohérent avec le thème Donjons & Dragons

Exemples acceptables :

- `LA QUETE COMMENCE`
- `LANCE LA BILLE`
- `MINE DETRUITE`
- `AVANTAGE ACTIVE`
- `TRESOR OUVERT`
- `GAME OVER`

Exemples à refuser :

- `Vous entrez dans un donjon mystérieux rempli de dangers`
- `Activation de l'événement spécial de progression`
- `Sauvegarde de Dextérité DC 15 réussie`
- `Bienvenue sur votre tableau de bord joueur`

---

## Revue état et données

La modification doit d'abord utiliser les signaux existants :

- `isPlaying`
- `playerCount`
- `currentPlayerIndex`
- `scores`
- `ballsRemaining`
- `scoreMultiplier`
- `mineHits`
- `rubiesActive`
- `leftKickbackActive`
- `rightKickbackActive`
- `ballInLauncher`
- `screenMessage`

Pour le score-claim, utiliser uniquement les hooks et copies existants :

- `useScoreClaimSession`
- `score-claim-copy.ts`

Si un signal manque, la modification doit :

- le déclarer comme gap dans la PR ou la documentation
- proposer un contrat minimal de state
- éviter les valeurs factices hardcodées

Signaux à ne pas inventer sans contrat :

- crédit
- tilt
- multiball
- jackpot
- boss mode
- IoT ready / lost
- leaderboard distant
- combo history

---

## Priorités attendues

L'ordre de priorité doit suivre la matrice :

- `P0` : critique, interrompt tout
- `P1` : événement fort
- `P2` : feedback gameplay bref
- `P3` : état permanent

Cas à vérifier :

- `GAME OVER` ne doit pas être masqué par un score temporaire
- `TILT !` doit interrompre tout autre affichage si l'état existe
- un message `screenMessage` ne doit pas remplacer durablement le score courant
- l'attract mode ne doit tourner que hors partie
- une transition joueur doit rester plus importante qu'un petit feedback de collision

---

## Attract mode

L'attract mode est valide si :

- il n'apparaît que quand aucune partie n'est active
- il affiche un seul message à la fois
- il reste lisible et lent
- il conserve une ambiance arcade fantasy
- il ne bloque pas le démarrage d'une partie

Messages de base recommandés :

- `INSERT COIN`
- `PRESS START`
- `CHOISIS TON DESTIN`
- `ROLL THE D20`
- `ENTER THE DUNGEON`
- `DRAGON AWAITS`

---

## Score-claim

Le DMD peut afficher l'état du score-claim, mais pas l'interface complète.

Autorisé :

- `SAVING SCORE`
- `SCORE SAVED`
- `SCAN TO CLAIM`
- `SCORE LINKED`
- `CLAIM EXPIRED`
- `CLAIM ERROR`

Interdit :

- QR code sur le DMD
- formulaire de connexion
- explication longue du claim
- duplication complète de l'overlay backglass

Pendant `claim_pending`, le DMD peut afficher un visuel pointillé original de personnage fantasy. Ce visuel doit rester décoratif, léger et ne doit pas être une image officielle issue d'une licence tierce.

---

## Tests attendus

Ajouter ou mettre à jour des tests si la modification introduit :

- un helper de formatage de score
- un helper de label joueur ou bille
- une sélection de message
- une logique de priorité
- une rotation d'attract mode
- un mapping score-claim vers message DMD
- une condition d'affichage selon le mode `web` / `arcade`

Les tests doivent vérifier le comportement, pas seulement le rendu.

Exemples de tests utiles :

- un message `P0` remplace un message `P2`
- le score est formaté de manière stable
- le joueur actif est affiché correctement
- l'attract mode ne tourne pas pendant une partie
- le score-claim `claim_approved` affiche le bon texte court
- un signal non disponible ne produit pas de faux message

Tests faibles à éviter :

- `renders without crashing`
- snapshot complet du DMD
- test qui valide uniquement la présence d'un conteneur
- test qui mocke tout l'état sans vérifier une règle métier

---

## Checklist avant merge

Avant merge, vérifier :

- le DMD reste plus simple que le backglass
- l'architecture page / composant / thème / logique est conservée
- les messages viennent de la matrice ou sont ajoutés à la matrice
- les nouveaux gaps sont documentés
- les effets visuels respectent la palette et les règles d'animation
- les tests ciblés passent
- `pnpm test` passe côté frontend si du code DMD a changé
- `pnpm build` passe côté frontend si du code DMD a changé

Commande recommandée depuis `frontend/` :

```bash
pnpm test
pnpm build
```

---

## Règle pour les IA

Une IA ne doit pas modifier le DMD avant d'avoir consulté :

- [dmd-design-contract.md](./dmd-design-contract.md)
- [dmd-message-matrix.md](./dmd-message-matrix.md)
- [gameplay-future-contract.md](./gameplay-future-contract.md)
- ce fichier

Si l'IA propose une fonctionnalité dont l'état source n'existe pas encore, elle doit d'abord créer ou proposer un contrat de state minimal au lieu d'inventer le comportement dans le composant.
