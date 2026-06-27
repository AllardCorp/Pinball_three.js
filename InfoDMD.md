# Les éléments à afficher sur les écrans

- Joueur actuel (P1, P2..) : DMD
- Score : DMD
- Multiplicateur en cours : DMD & Playfield
- Crédit : Backglass
- Nombre de bille actuel sur le plateau : 
- Nombre de vie : DMD, Playfield ?
- Etat de la mine (effet de mine détruite) : DMD
- Rubis collectés (effet de mine détruite) : DMD 
- icon classes : DMD (Bouclier ; Arc ; crâne ; Marteau)
- Message (apparition de l'épée) : DMD
- QR code: BackGlass
- Cooldown (le temps avant de pouvoir réactiver un pouvoir) : playfield
- Leader board : backglass

## Layout live cible du DMD

Le DMD live doit rester une surface de score, pas un dashboard. Les zones fixes sont :

- Haut gauche : joueur courant (`P1`, `P2`, etc.).
- Haut droite : vies restantes sous forme de 3 coeurs pixelisés.
- Centre : score en grand.
- Sous le score : piste de multiplicateurs `x2`, `x6`, `x8`, `x12`.
- Si le bonus soleil `x50` est actif : la piste des multiplicateurs est remplacée par `x50`.
- Bas : phrase courte Donjons & Dragons ou message d'événement.
- Gauche milieu : icône de classe active.
- Droite : vide par défaut.

La matrice logique reste en `192x64`, mais le rendu doit remplir toute la dalle `16:9` du DMD. On accepte donc un pas horizontal et vertical différent pour éviter les bandes noires en haut et en bas de l'écran physique.

## Accueil et fin de partie

Quand aucune partie n'a encore été lancée, le DMD affiche un écran d'accueil simple :

- titre : `INSERER UNE MONNAIE`
- message bas : `POUR COMMENCER LA PARTIE`
- animation légère : pièce / torches en diodes

Quand une partie se termine, le DMD affiche :

- `GAME OVER` en rouge
- score final en dessous
- animation d'explosion en diodes derrière le texte

## Vies

La vie correspond au nombre de billes restantes à jouer, normalement `3` au total.

Rendu attendu :

- vie active : coeur pixelisé pleinement allumé
- vie perdue : même forme de coeur encore visible, mais en diodes éteintes / braise sombre
- pas de nombre texte pour les vies

## Score

Le score doit rester la donnée la plus lisible.

Rendu attendu :

- score en très grand au centre
- effet d'impact quand le score augmente : grossissement court, flash lumineux, retour au calme
- pas d'effet qui empêche la lecture
- le score doit rester dans le cadre même à `100 000 000` points et plus, quitte à réduire automatiquement l'échelle
- l'effet d'impact ne doit jamais dessiner un second score fantôme derrière le score principal

## Multiplicateurs

La piste affiche les multiplicateurs permanents ou déclenchables :

- `x2`
- `x6`
- `x8`
- `x12`

Règles :

- les multiplicateurs actifs sont allumés
- les multiplicateurs inactifs restent visibles en diode sombre
- `x50` n'apparaît pas dans la piste normale
- si `x50` est actif, il remplace toute la ligne avec un effet spécial de soleil

## Messages D&D

La bande basse affiche des phrases courtes tirées ou inspirées de Donjons & Dragons.

Exemples :

- `ROLL FOR INITIATIVE`
- `NAT 20`
- `THE DRAGON AWAKES`
- `ADVANTAGE GAINED`
- `CRITICAL HIT`

Les messages rares, comme `x50`, peuvent déclencher un effet supplémentaire, mais l'effet ne doit pas masquer le score.

## Classes

La classe active est en cours de développement par un autre membre de l'équipe.

En attendant, le DMD peut utiliser un mock explicite, remplaçable plus tard par l'état réel du store.

Icônes prévues :

- guerrier : bouclier
- elfe : arc
- nécromancien : crâne
- nain : marteau

Ces icônes doivent être dessinées en diodes directement dans le canvas. Si une image source existe, le rendu la convertit en motif DMD basse résolution ; sinon il utilise le fallback dessiné en code.

Les icônes ne doivent pas être accompagnées d'un libellé (`WAR`, `ELF`, `NEC`, `DWF`) ni de lignes décoratives. La zone doit rester propre et lisible uniquement par le pictogramme.

Quand une image finale est fournie, elle peut être convertie en matrice DMD :

- image source dans `frontend/src/assets/dmd/`
- redimensionnement vers une grille basse résolution
- pixels sombres convertis en diodes allumées
- fallback vers l'icône dessinée en code si l'image ne charge pas

Icônes converties actuellement utilisées :

- guerrier : `frontend/src/assets/dmd/bouclier-dmd.png`
- elfe : `frontend/src/assets/dmd/arc-dmd.png`
- nécromancien : `frontend/src/assets/dmd/crane-dmd.png`
- nain : `frontend/src/assets/dmd/marteau-dmd.png`

## Animations contextuelles

La zone droite reste vide par défaut.

Les animations contextuelles doivent se placer derrière le score, sans le cacher :

- 3 rubis activés : effet rubis derrière le score
- multiplicateur fort / bonus soleil : effet soleil derrière le score
- entrée mine / mine ouverte : animation sprite sheet derrière le score

Les mines et rubis ne sont pas affichés en permanence comme les vies.

Animation mine utilisée :

- asset : `frontend/src/assets/dmd/anime-mine.png`
- format attendu : sprite sheet horizontale `1024x48`
- contenu : `16` frames de `64x48`
- rendu : conversion en diodes au chargement, puis lecture frame par frame en canvas
- pendant l'animation, le score passe temporairement en haut en format compact
- les multiplicateurs et le message bas sont masqués pendant cette courte animation

`anime-mine2.png` n'est pas adapté au rendu DMD direct car il est trop haut pour la matrice live.
