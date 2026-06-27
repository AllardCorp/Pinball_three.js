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

## Variables côté flipper

```env
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
DATABASE_URL=postgresql://...
```

Le VPS utilise `SCORE_CLAIM_MODE=local` car il écrit dans sa propre base. Il expose en plus la route sécurisée `/api/borne/score-claims/start` pour recevoir les scores des bornes autorisées.

## Sécurité

- Le QR code ne contient qu'un `claimCode` temporaire, jamais un secret.
- `BORNE_TOKEN` est transmis uniquement de backend à backend.
- La route borne refuse les requêtes sans `Authorization: Bearer ...`.
- L'utilisateur doit être authentifié avant de rattacher le score.
- Le claim expire et ne peut être approuvé qu'une seule fois.
- Si le VPS est indisponible, le backend local renvoie une erreur : le backglass ne doit pas afficher de faux QR code.
