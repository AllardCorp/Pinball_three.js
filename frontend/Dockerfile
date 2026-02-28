# Étape 1 : Construction (Build)
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

# Installation optimisée avec pnpm
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Étape 2 : Serveur de production (Nginx)
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
# Copie du build vers le répertoire Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuration pour gérer le routage React (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
