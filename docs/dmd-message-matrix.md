# Matrice de messages DMD

## Objet

Ce document définit les messages que le DMD doit pouvoir afficher, leur priorité et leur source de vérité.

Il complète le contrat visuel du DMD :

- [dmd-design-contract.md](./dmd-design-contract.md)
- [dmd-review-checklist.md](./dmd-review-checklist.md)
- [gameplay-future-contract.md](./gameplay-future-contract.md)

Le but est d'éviter trois problèmes :

- inventer des messages impossibles à brancher sur l'état actuel du jeu
- afficher trop d'informations en même temps
- perdre le ton `Donjons & Dragons` au profit d'une interface générique

---

## Principes de texte

Le DMD doit privilégier des messages :

- courts
- lisibles en moins d'une seconde
- orientés action ou résultat
- compatibles avec une lecture à distance
- cohérents avec le vocabulaire flipper

Règle de base :

> Verbe court + cible claire + récompense ou état.

Exemples :

- `TIRE LA RAMPE`
- `SCELLE LA RUNE`
- `BALLE SAUVEE`
- `JACKPOT DE FEU`

Les messages DMD doivent éviter :

- les phrases longues
- le lore détaillé
- les formulations trop littéraires
- le jargon D&D incompréhensible sans action de jeu

---

## Vocabulaire autorisé

### Vocabulaire flipper

- `SCORE`
- `BALL`
- `PLAYER`
- `JACKPOT`
- `SUPER JACKPOT`
- `MULTIBALL`
- `LOCK`
- `COMBO`
- `BONUS`
- `EXTRA BALL`
- `BALL SAVE`
- `HURRY-UP`
- `GAME OVER`

### Vocabulaire D&D

- `QUETE`
- `DONJON`
- `ANTRE`
- `RUNE`
- `SCEAU`
- `RELIQUE`
- `PORTAIL`
- `TRESOR`
- `DRAGON`
- `BOSS`
- `CRITIQUE`
- `INSPIRATION`
- `AVANTAGE`
- `SAUVEGARDE`

### Règle de langue

Les textes affichés peuvent mélanger français et vocabulaire arcade anglais quand le terme est standard dans le flipper.

Exemples acceptés :

- `SUPER JACKPOT`
- `MULTIBALL DRAGON`
- `BALL SAVE`

Exemples à éviter :

- `SAUVEGARDE DE DEXTERITE DC 15`
- `VOUS ENTREZ DANS LE DONJON ANCESTRAL`
- `ACTIVATION DE L'EVENEMENT SPECIAL`

---

## Priorités

### P0 - Critique

Interrompt tout le reste.

Exemples :

- `TILT !`
- `GAME OVER`
- `BALL SAVE`
- erreur système critique

### P1 - Evénement fort

Interrompt les messages d'ambiance et les scores temporaires.

Exemples :

- `GAME START`
- `MULTIBALL`
- `JACKPOT`
- `SUPER JACKPOT`
- `QUEST READY`
- `SCORE LINKED`

### P2 - Feedback gameplay

Affiché brièvement, sans bloquer les événements forts.

Exemples :

- `+500`
- `RUNE SCELLEE`
- `MINE DETRUITE`
- `COMBO`
- `KICKBACK`

### P3 - Etat permanent

Affichage par défaut quand rien de plus important n'est actif.

Exemples :

- score courant
- joueur actif
- bille restante
- état idle

---

## Durées

Durées recommandées :

- P0 : `3000ms` ou jusqu'au changement d'état
- P1 : `1800ms` à `2500ms`
- P2 : `900ms` à `1400ms`
- P3 : permanent

Un message plus prioritaire peut interrompre un message moins prioritaire.

Un message moins prioritaire ne doit pas interrompre un message plus prioritaire.

---

## Matrice principale

| ID | Etat / trigger | Source attendue | Priorité | Texte principal | Texte secondaire | Durée | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `idle` | Aucune partie en cours | `isPlaying=false` | P3 | `INSERER UNE MONNAIE` | `POUR COMMENCER LA PARTIE` | Permanent | Disponible |
| `game-start` | Partie lancée | `startGame()` | P1 | `LA QUETE COMMENCE` | `PLAYER {n}` | 2200ms | A brancher |
| `player-turn` | Changement de joueur | `currentPlayerIndex` | P1 | `PLAYER {n}` | `BALL {ball}` | 1800ms | Disponible |
| `score-default` | Partie en cours | `scores[currentPlayerIndex]` | P3 | `{score}` | phrase D&D ou événement court | Permanent | Disponible |
| `ball-ready` | Bille au lanceur | `ballInLauncher=true` | P2 | `{score}` | `PULL THE PLUNGER` | Tant que la bille est au lanceur | Disponible |
| `ball-lost` | Perte de bille | `loseBall()` | P1 | `BILLE PERDUE` | `PLAYER {next}` | 1800ms | A brancher |
| `game-over` | Fin de partie | `gameOver()` | P0 | `GAME OVER` rouge | `{finalScore}` avec explosion DMD | 3000ms | Disponible |
| `score-message` | Message gameplay temporaire | `screenMessage` | P2 | `{score}` | `{message}` en bande basse | 1200ms | Disponible |
| `score-target` | Cible simple | collision cible | P2 | `+50` | `TOUCHE` | 900ms | A brancher |
| `slingshot-hit` | Slingshot touché | collision slingshot | P2 | `+100` | `REBOND` | 900ms | A brancher |
| `bumper-hit` | Bumper touché | collision bumper | P2 | `+500` | `IMPACT` | 900ms | A brancher |
| `mine-hit` | Mine touchée | `mineHits` | P2 | `MINE FRAPPEE` | `+500` | 1100ms | Partiel |
| `mine-destroyed` | Mine détruite | `displayMessage()` existant | P1 | `MINE DETRUITE` | `+500` | 1800ms | Disponible |
| `rune-lit` | Rubis / rune activée | `rubiesActive` | P2 | `RUNE SCELLEE` | `{count}/3` | 1200ms | Disponible |
| `all-runes` | Toutes les runes actives | `rubiesActive.every` | P1 | `TRESOR OUVERT` | `+5000` | 2200ms | Disponible |
| `multiplier-up` | Multiplicateur augmente | `scoreMultiplier` | P1 | `AVANTAGE ACTIVE` | `BONUS X{value}` | 1800ms | Disponible |
| `kickback-used` | Kickback consommé | `leftKickbackActive/rightKickbackActive` | P2 | `KICKBACK` | `+2500` | 1200ms | Disponible |
| `credit-added` | Crédit ajouté | `coin_slot` | P1 | `CREDIT ADDED` | `PRESS START` | 1800ms | Non modélisé |
| `tilt-warning` | Nudge proche seuil | `nudge` + compteur | P1 | `DANGER TILT` | `CALME LA TABLE` | 1800ms | Non modélisé |
| `tilt` | Tilt actif | futur état `tilt` | P0 | `TILT !` | `FLIPPERS LOCKED` | 3000ms | Non modélisé |
| `iot-ready` | IoT connecté | futur état MQTT / device | P2 | `IOT READY` | `LINK STABLE` | 1600ms | Non modélisé |
| `iot-lost` | IoT déconnecté | futur état MQTT / device | P1 | `IOT LOST` | `KEYBOARD FALLBACK` | 2200ms | Non modélisé |

---

## Layout live

Pendant une partie, le score reste toujours l'information centrale.

Zones fixes :

- haut gauche : joueur courant (`P1`, `P2`, etc.)
- haut droite : 3 coeurs pixelisés représentant les vies / billes restantes
- centre : score courant en grand
- sous le score : piste de multiplicateurs `x2`, `x6`, `x8`, `x12`
- bande basse : phrase D&D ou message gameplay court
- gauche milieu : icône de classe active
- droite : vide par défaut

Règles :

- un message temporaire ne remplace pas le score pendant la partie
- une vie perdue garde une forme de coeur visible en diodes sombres
- les multiplicateurs inactifs restent visibles en diodes sombres
- `x50` n'est pas affiché dans la piste normale
- quand `x50` est actif, il remplace la piste des multiplicateurs avec un effet soleil
- les rubis et mines ne sont pas affichés en permanence ; ils déclenchent seulement des animations contextuelles derrière le score
- l'entrée de mine utilise la sprite sheet DMD `frontend/src/assets/dmd/anime-mine.png`
- les icônes de classe peuvent être mockées en attendant l'état réel du store
- les icônes prévues sont `bouclier`, `arc`, `crâne`, `marteau`
- les icônes de classe restent sans libellé et sans lignes décoratives
- la matrice logique `192x64` remplit toute la dalle `16:9`, avec un pas horizontal et vertical indépendant pour éviter les bandes noires

Messages bas recommandés :

- `ROLL FOR INITIATIVE`
- `ADVANTAGE GAINED`
- `THE PARTY RALLIES`
- `ARCANE SURGE`
- `CRITICAL BLESSING`
- `NAT 20 - DRAGON AWAKES`

---

## Score claim

Le score-claim existe déjà côté frontend et backend.

Le DMD doit rester informatif, mais ne doit pas afficher le QR code. Le QR code appartient au backglass ou à l'écran mobile.

Pendant l'attente de scan, le DMD peut afficher un sceau, une arche ou un ornement abstrait en diodes pour occuper l'écran sans dupliquer l'interface de claim.

Les personnages, portraits ou images figuratives ne doivent pas être ajoutés comme placeholders tant que le pipeline final d'images DMD n'est pas validé.

Les libellés techniques du workflow (`SCORE CLAIM`, `ARCHIVE`, raison backend longue, statut interne) ne doivent pas apparaître sur le DMD. Ils peuvent rester sur le backglass ou dans les logs, mais le DMD doit conserver un vocabulaire court de borne médiévale.

| Phase | Source | Priorité | Texte principal | Texte secondaire | Durée | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| `submitting` | `score-claim-session-store` | P1 | `SAVING SCORE` | `GRIMOIRE OUVERT` | Etat | Disponible |
| `discarded` | `score-claim-session-store` | P1 | `SCORE NOT SAVED` | `RETOUR AU DONJON` | 2200ms | Disponible |
| `saved` | `score-claim-session-store` | P1 | `SCORE SAVED` | `GRIMOIRE SCELLE` | 2200ms | Disponible |
| `claim_pending` | `score-claim-session-store` | P1 | `SCAN TO CLAIM` | `HEROS EN ATTENTE` + sceau en diodes | Etat | Disponible |
| `claim_approved` | `score-claim-session-store` | P1 | `SCORE LINKED` | `HEROS IDENTIFIE` | 2500ms | Disponible |
| `claim_expired` | `score-claim-session-store` | P1 | `CLAIM EXPIRED` | `PORTAIL FERME` | 2500ms | Disponible |
| `error` | `score-claim-session-store` | P1 | `CLAIM ERROR` | `RITUEL INTERROMPU` | 2500ms | Disponible |

---

## Attract mode

L'attract mode doit être lisible et cyclique.

Messages recommandés :

- `INSERT COIN`
- `PRESS START`
- `CHOISIS TON DESTIN`
- `ROLL THE D20`
- `ENTER THE DUNGEON`
- `DRAGON AWAITS`
- `HIGH SCORE {score}`

Règles :

- un seul message à la fois
- rotation lente
- pas de texte long
- possibilité d'ajouter une micro-animation runique

---

## Messages réservés

Ces messages sont validés comme direction de ton, mais ne doivent être branchés que lorsque le gameplay correspondant existe.

| Message | Condition nécessaire |
| --- | --- |
| `JET CRITIQUE !` | système de critique / jackpot équivalent |
| `ECHEC CRITIQUE` | drain, miss ou pénalité explicite |
| `MULTIBALL DRAGON` | vrai état multiball |
| `JACKPOT DE FEU` | vrai jackpot |
| `SUPER JACKPOT` | vrai super jackpot |
| `LOCK RELIQUE` | mécanisme de lock |
| `PORTAIL ALLUME` | objectif / mode portal |
| `BOSS REVELE` | boss mode |
| `LA LICHE S'EVEILLE` | mode narratif dédié |
| `INSPIRATION GAGNEE` | récompense / bonus spécifique |

Les messages liés aux multiplicateurs, classes, multibille, light road, mine, fakir et bonus soleil sont détaillés dans :

- [gameplay-future-contract.md](./gameplay-future-contract.md)

---

## Gaps avant implémentation robuste

Le DMD peut déjà afficher une version simple basée sur le store actuel.

Pour une version robuste, il faudra clarifier :

- un état `gamePhase` explicite au lieu de déduire idle/game over uniquement avec `isPlaying`
- une queue d'événements DMD avec priorité, durée, timestamp et source
- un mapping stable entre collisions et messages
- un vrai état `tilt`
- un vrai état `credit`
- un vrai état `iot`
- le déclenchement automatique du score-claim à la fin de partie

---

## Sources

- D&D Beyond Basic Rules : https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game
- D&D Beyond Rules Glossary : https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary
- D&D Beyond Monsters : https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster
- Baldur's Gate 3 : https://baldursgate3.game/
- IPDB Pinball Glossary : https://www.ipdb.org/glossary.php
- Pinball overview : https://en.wikipedia.org/wiki/Pinball
