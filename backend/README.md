# Backend

Le backend fournit :

- l'API Express
- la connexion PostgreSQL
- le schema Drizzle
- les migrations SQL
- l'authentification Better Auth

## Structure

- `src/server.ts` : point d'entree de l'API
- `src/auth.ts` : configuration Better Auth
- `src/db/client.ts` : client PostgreSQL et Drizzle
- `src/db/schema.ts` : definition des tables
- `drizzle/` : migrations générées
- `drizzle.config.ts` : configuration Drizzle Kit


## Tests backend

Le backend utilise deux niveaux de tests :

- `pnpm test` : tests unitaires
- `pnpm run test:integration` : tests d'intégration HTTP avec une vraie base PostgreSQL jetable

### Configuration locale des tests d'intégration

1. Copier `backend/.env.test.example` vers `backend/.env.test.local`
2. Vérifier la valeur de `DATABASE_URL_TEST`
3. Démarrer PostgreSQL localement

Depuis la racine du projet :

```bash
docker compose -f compose.dev.yml up -d postgres
```

Rôle de `DATABASE_URL_TEST` :

- cette URL ne pointe pas vers la base de développement du projet
- elle doit pointer vers une base d'administration PostgreSQL capable de créer des bases temporaires
- les tests créent ensuite une base dédiée, appliquent les migrations, puis la suppriment à la fin


## Commandes utiles pour la db : 
```bash
docker compose -f ../compose.dev.yml up -d postgres backend drizzle-studio
docker compose -f ../compose.dev.yml exec backend pnpm db:generate
docker compose -f ../compose.dev.yml exec backend pnpm db:migrate
```

## Tables actuelles

Tables Better Auth :
- `users`
- `accounts`
- `sessions`
- `verifications`

Tables métier :
- `games`
- `scores`
- `score_claim_requests`

Énumérations PostgreSQL :
- `score_claim_status`

Relations principales :
- `accounts.user_id -> users.id`
- `sessions.user_id -> users.id`
- `games.user_id -> users.id`
- `scores.game_id -> games.id`
- `score_claim_requests.game_id -> games.id`
- `score_claim_requests.user_id -> users.id`
## Verification rapide

Verifier la sante de l'API :

```bash
curl http://localhost:3000/health
```

Ouvrir Drizzle Studio :

```text
https://local.drizzle.studio
```

Le port `4983` est expose localement pour le backend de Drizzle Studio.
