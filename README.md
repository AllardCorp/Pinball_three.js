# Pinball Three.js

Ce projet a pour ambition de recréer l'expérience d'un flipper physique à travers une architecture web moderne, distribuée et interactive.
L'objectif n'est pas seulement de reproduire un jeu, mais de concevoir un système complet temps réel, combinant :

- Simulation physique 3D
- Communication distribuée (WebSockets + MQTT)
- Intégration IoT
- Expérience utilisateur immersive

Le projet vise à démontrer la capacité à concevoir une architecture logicielle complexe inspirée d'un système réel (flipper mécanique) tout en exploitant les technologies web contemporaines.
Ce projet est réalisé dans le cadre validation de la troisième année de _Bachelor Développeur Web_ à HETIC, et s'inscrit dans une démarche d'apprentissage par la pratique, en appliquant les concepts de développement web, d'architecture logicielle et de communication temps réel.

---

## Lancer le projet

Ce projet est contenu dans un conteneur Docker. Pour le lancer, utilisez la commande suivante dans le terminal à la racine du projet :

```bash
docker compose -f compose.dev.yml up -d
```

Services principaux disponibles en développement :

- Frontend : `http://localhost:5173`
- Backend API : `http://localhost:3000`
- Drizzle Studio backend : `localhost:4983`
- PostgreSQL : `localhost:5432`
- Mosquitto : `localhost:1883`

---

## Base de données

La base de données du projet repose sur :

- PostgreSQL
- Drizzle ORM
- Drizzle Studio pour la visualisation en développement

Tables actuellement initialisées :

- `users`
- `games`
- `scores`

### Exécuter les migrations en développement

Démarrer les services nécessaires :

```bash
docker compose -f compose.dev.yml up -d postgres backend drizzle-studio
```

Appliquer les migrations Drizzle depuis le conteneur backend :

```bash
docker compose -f compose.dev.yml exec backend pnpm db:migrate
```

### Générer une nouvelle migration

Après modification du schéma dans `backend/src/db/schema.ts` :

```bash
docker compose -f compose.dev.yml exec backend pnpm db:generate
docker compose -f compose.dev.yml exec backend pnpm db:migrate
```

### Accéder à la base avec Drizzle Studio

Ouvrir `https://local.drizzle.studio`.

Le service `drizzle-studio` est disponible uniquement en développement.
Le port `4983` correspond au backend local utilisé par Drizzle Studio.

### Production

En production, les migrations sont exécutées par le service `migrate` avant le démarrage du backend.
Il n'y a pas d'interface d'administration de la base exposée.

Commande de déploiement :

```bash
docker compose -f compose.prod.yml up -d --build
```

---

## Tests

Les tests sont situés dans `frontend/src/tests/` et s'exécutent depuis le dossier `frontend/`.

**Lancer les tests :**

```bash
cd frontend
pnpm test
```

**Vérifier la couverture de code (seuil minimum : 80%) :**

```bash
cd frontend
pnpm coverage
```

Le rapport de couverture HTML est généré dans `frontend/coverage/` (ignoré par git).

---

## Collaborateurs :

- Adrien Allard (Chef de projet)
- Stéphane Descarpentries
- Amaury Sanchez
- Christopher De Pasqual
