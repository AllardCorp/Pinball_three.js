# Backend

Le backend fournit :

- l'API Express
- la connexion PostgreSQL
- le schema Drizzle
- les migrations SQL

## Structure

- `src/server.ts` : point d'entree de l'API
- `src/db/client.ts` : client PostgreSQL et Drizzle
- `src/db/schema.ts` : definition des tables
- `drizzle/` : migrations generees
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
2. Generer la migration
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
- `games`
- `scores`

Relations :

- `games.user_id -> users.id`
- `scores.game_id -> games.id`

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
