# --- Étape 1 : Toutes les dépendances (pour le build) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# --- Étape 2 : Construction du code (TypeScript -> JS) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src
RUN corepack enable && pnpm run build

# --- Étape 3 : Uniquement les dépendances de prod ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Le flag --prod ignore les devDependencies !
RUN corepack enable && pnpm install --prod --frozen-lockfile

# --- Étape 4 : Image finale (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# On active corepack une bonne fois pour toutes dans l'image
RUN corepack enable

# Sécurité : On bascule sur l'utilisateur non privilégié
USER node

# On récupère le strict minimum
COPY package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node drizzle.config.ts ./
COPY --from=build --chown=node:node /app/drizzle ./drizzle

EXPOSE 3000

# Commande de démarrage épurée
CMD ["pnpm", "run", "start"]