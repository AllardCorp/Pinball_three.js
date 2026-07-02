# Étape 1 : Construction (Build)
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

# Installation optimisée avec pnpm
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .

# --- AJOUT CRUCIAL ICI ---
# On déclare que le Dockerfile va recevoir ces arguments depuis le docker-compose
ARG VITE_APP_TARGET
ARG VITE_API_URL
ARG VITE_MQTT_USERNAME
ARG VITE_MQTT_PASSWORD
ARG VITE_MQTT_URL

# On les transforme en variables d'environnement pour que Vite puisse les lire
ENV VITE_APP_TARGET=$VITE_APP_TARGET
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MQTT_USERNAME=$VITE_MQTT_USERNAME
ENV VITE_MQTT_PASSWORD=$VITE_MQTT_PASSWORD
ENV VITE_MQTT_URL=$VITE_MQTT_URL
# -------------------------

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
