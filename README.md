# Pinball Three.js

Ce projet a pour ambition de recréer l’expérience d’un flipper physique à travers une architecture web moderne, distribuée et interactive.
L’objectif n’est pas seulement de reproduire un jeu, mais de concevoir un système complet temps réel, combinant :

- Simulation physique 3D
- Communication distribuée (WebSockets + MQTT)
- Intégration IoT
- Expérience utilisateur immersive

Le projet vise à démontrer la capacité à concevoir une architecture logicielle complexe inspirée d’un système réel (flipper mécanique) tout en exploitant les technologies web contemporaines.
Ce projet est réalisé dans le cadre validation de la troisième année de _Bachelor Développeur Web_ à HETIC, et s’inscrit dans une démarche d’apprentissage par la pratique, en appliquant les concepts de développement web, d’architecture logicielle et de communication temps réel.

---

## Lancer le projet

Ce projet est contenu dans un conteneur Docker. Pour le lancer, utilisez la commande suivante dans le terminal à la racine du projet :

**Développement :**

```bash
docker compose -f compose.dev.yml up -d
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
