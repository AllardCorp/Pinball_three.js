# Score claim avec VPS

## Objectif

Le flipper peut rester en local pour les écrans (`playfield`, `backglass`, `dmd`), mais le QR code doit pointer vers une URL publique. Un téléphone ne peut pas ouvrir `localhost` du flipper : pour lui, `localhost` désigne le téléphone lui-même.

## Flux retenu

1. Le front local du flipper termine une partie et appelle son backend local sur `/api/score-claims/start`.
2. Si `SCORE_CLAIM_MODE=local`, le backend garde le comportement historique et écrit dans sa base locale.
3. Si `SCORE_CLAIM_MODE=remote`, le backend local relaie le score vers le VPS sur `/api/borne/score-claims/start`.
4. Le backend local ajoute `Authorization: Bearer <BORNE_TOKEN>` à l'appel server-to-server.
5. Le VPS vérifie `BORNE_TOKEN`, écrit le score dans sa base PostgreSQL, crée le `claimCode`, puis renvoie une `verificationUrl` publique.
6. Le backglass local affiche le QR code avec cette `verificationUrl`.
7. Le téléphone ouvre le VPS, l'utilisateur se connecte, puis le VPS rattache le score au compte.

## Source de vérité

En mode remote, la base de données source de vérité pour `games`, `users` et `score_claim_requests` est celle du VPS. La base locale du flipper ne doit pas servir à valider un QR code public.

## Frontend public VPS

Le VPS ne doit pas charger le jeu complet. Son build frontend est ciblé avec
`VITE_APP_TARGET=public` et expose uniquement les pages utiles au téléphone :

- `/` : accueil public minimal.
- `/login` : connexion ou création de compte.
- `/score-claim?code=...` : rattachement du score après scan QR.
- `/dashboard` : espace utilisateur authentifié.

Les pages `/playfield`, `/backglass` et `/dmd` restent réservées au flipper
local. Le build public ne monte pas `MqttProvider`, ce qui évite les erreurs
`Mixed Content` provoquées par un WebSocket MQTT `ws://` depuis une page HTTPS.

La route `/score-claim` n'est pas mise en avant dans la navigation. Sans
paramètre `code`, elle ne permet aucune action de sauvegarde : le score doit
toujours venir d'un claim créé par le backend VPS.

## Variables côté flipper

```env
VITE_APP_TARGET=flipper
SCORE_CLAIM_MODE=remote
GLOBAL_API_URL=https://votre-vps.example
BORNE_TOKEN=secret_long_et_aleatoire
VITE_API_URL=http://localhost:3000
```

`BORNE_TOKEN` reste côté backend local. Il ne doit jamais être préfixé par `VITE_`, sinon il serait injecté dans le bundle frontend.

## Variables côté VPS

```env
SCORE_CLAIM_MODE=local
FRONTEND_URL=https://votre-vps.example
BETTER_AUTH_URL=https://votre-vps.example
FRONTEND_ORIGINS=https://votre-vps.example
BORNE_TOKEN=le_meme_secret_que_la_borne
POSTGRES_DB=pinball_db
POSTGRES_USER=pinball_user
POSTGRES_PASSWORD=secret_long_et_aleatoire
BETTER_AUTH_SECRET=secret_long_et_aleatoire
```

Le VPS utilise `SCORE_CLAIM_MODE=local` car il écrit dans sa propre base. Il expose en plus la route sécurisée `/api/borne/score-claims/start` pour recevoir les scores des bornes autorisées.

Le build public VPS force `VITE_APP_TARGET=public` directement dans
`deploy/docker-compose.vps.yml`. Il ne faut pas définir `VITE_API_URL` sur
`localhost` côté VPS : sans valeur explicite, le frontend appelle sa propre
origine HTTPS et Nginx relaie `/api` vers le backend Docker.

Le `.env` du VPS est maintenu directement sur le serveur et n'est pas écrasé par
la CI. Les secrets réels ne doivent pas être versionnés dans le dépôt.

## Réseau Docker côté VPS

Le reverse proxy Nginx du VPS est le seul point d'entrée public HTTP/HTTPS :

- Nginx sert `https://votre-vps.example`.
- Le VPS doit être lancé avec `deploy/docker-compose.vps.yml`.
- Le frontend Docker écoute seulement sur `127.0.0.1:8080`.
- Le backend Docker écoute seulement sur `127.0.0.1:3000`.
- PostgreSQL n'est pas publié sur le host : seul le réseau Docker interne y accède.

`deploy/docker-compose.yml` reste dédié au flipper physique via `fliphetic.toml`.
Ce fichier build le jeu complet avec `VITE_APP_TARGET=flipper`, expose les écrans
attendus par la borne et garde Mosquitto actif.

Mosquitto n'est pas démarré par défaut dans `deploy/docker-compose.vps.yml`. Il est
placé sous le profil Docker `mqtt`, car le VPS public n'a pas besoin de piloter
la borne physique. Si un jour ce service redevient nécessaire côté serveur, il
faudra l'activer explicitement avec `--profile mqtt` et sécuriser l'exposition
des ports.

## Sécurité

- Le QR code ne contient qu'un `claimCode` temporaire, jamais un secret.
- `BORNE_TOKEN` est transmis uniquement de backend à backend.
- La route borne refuse les requêtes sans `Authorization: Bearer ...`.
- L'utilisateur doit être authentifié avant de rattacher le score.
- Le claim expire et ne peut être approuvé qu'une seule fois.
- Si le VPS est indisponible, le backend local renvoie une erreur : le backglass ne doit pas afficher de faux QR code.
