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

## Scripts

Depuis `backend/` :

```bash
pnpm dev
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Workflow recommande

1. Modifier le schema dans `src/db/schema.ts`
2. Générer la migration
3. Appliquer la migration
4. Verifier le resultat dans Drizzle Studio

Exemple via Docker :

```bash
docker compose -f compose.dev.yml up -d postgres backend drizzle-studio
docker compose -f compose.dev.yml exec backend pnpm db:generate
docker compose -f compose.dev.yml exec backend pnpm db:migrate
```

## Tables actuelles

- `users`
- `accounts`
- `sessions`
- `verifications`
- `games`
- `scores`

Relations :

- `games.user_id -> users.id`
- `scores.game_id -> games.id`

## Auth

Better Auth est expose sur `/api/auth/*`.

La session serveur peut aussi etre lue sur :

```text
GET /api/me
```

Variables d'environnement attendues :

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Verification rapide

Verifier la sante de l'API :

```bash
curl http://localhost:3000/health
```

Lister les tables PostgreSQL :

```bash
docker compose -f compose.dev.yml exec postgres psql -U pinball_user -d pinball_db -c "\dt"
```

Ouvrir Drizzle Studio :

```text
https://local.drizzle.studio
```

Le port `4983` est expose localement pour le backend de Drizzle Studio.
