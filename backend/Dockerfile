# --- Étape 1 : Toutes les dépendances (pour le build) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# `better-sqlite3` passe par `node-gyp` sur Alpine, donc il faut les outils
# natifs dès l'installation des dépendances.
RUN apk add --no-cache python3 make g++ \
  && corepack enable \
  && corepack prepare pnpm@9.15.4 --activate \
  && pnpm install --frozen-lockfile

# --- Étape 2 : Construction du code (TypeScript -> JS) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm run build

# --- Étape 3 : Uniquement les dépendances de prod ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# On verrouille aussi `pnpm` ici pour éviter qu'une version plus récente
# casse le build avec Node 20 dans l'image de production.
RUN apk add --no-cache python3 make g++ \
  && corepack enable \
  && corepack prepare pnpm@9.15.4 --activate \
  && pnpm install --prod --frozen-lockfile

# --- Étape 4 : Image finale (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

USER node

COPY package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node drizzle.config.ts ./
COPY --from=build --chown=node:node /app/drizzle ./drizzle

EXPOSE 3000

CMD ["pnpm", "run", "start"]
