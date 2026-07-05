# Système Maker — Documentation complète

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Routage et authentification](#2-routage-et-authentification)
3. [Flux de données global](#3-flux-de-données-global)
4. [Store — `useMakerStore`](#4-store--usemakerstore)
5. [Config centrale — `config/makerElementConfig.ts`](#5-config-centrale--configmakerelementconfigts)
6. [Pages éditeur — `FlipperMaker.tsx` et sous-pages](#6-pages-éditeur--flippermakertsx-et-sous-pages)
7. [Page gameplay — `PlayfieldMaker.tsx`](#7-page-gameplay--playfieldmakertsx)
8. [Composant modèle 3D — `PinballMVP_Maker.tsx`](#8-composant-modèle-3d--pinballmvp_makertsx)
9. [Composant éditeur — `PlayfieldElement.tsx`](#9-composant-éditeur--playfieldelementtsx)
10. [Composant gameplay — `PhysicsPlayfieldElement.tsx`](#10-composant-gameplay--physicsplayfieldelementtsx)
11. [Backend — Schema BDD](#11-backend--schema-bdd)
12. [Backend — Routes API](#12-backend--routes-api)
13. [Utilitaire — `lib/api.ts`](#13-utilitaire--libapiys)
14. [Relations entre fichiers](#14-relations-entre-fichiers)
15. [Cycle complet : Créer → Sauvegarder → Modifier → Jouer → Supprimer](#15-cycle-complet--créer--sauvegarder--modifier--jouer--supprimer)

---

## 1. Vue d'ensemble

Le système Maker permet de :
- **Créer** un niveau personnalisé en plaçant des obstacles 3D sur le plateau
- **Sauvegarder** ce niveau en base de données (avec screenshot)
- **Lister** tous les niveaux existants (public, sans connexion)
- **Modifier** et **supprimer** ses propres niveaux (connexion requise, propriétaire uniquement)
- **Jouer** n'importe quel niveau avec toute la physique active (balle, flippers, bumpers) — sans connexion

Il existe en **deux modes** distincts qui partagent les mêmes données :

| Mode | Route | Composant plateau | Physique | Connexion |
|------|-------|-------------------|----------|-----------|
| Éditeur (liste + création + édition) | `/maker/*` | `PinballMVPMaker` (sans prop) | Aucune — PivotControls | **Requise** |
| Gameplay | `/playfield/:levelId` | `PinballMVPMaker withPhysics` | Rapier complet | Publique |

---

## 2. Routage et authentification

**Fichier :** `frontend/src/FlipperApp.tsx`

```
/                    → Home
/maker/*             → FlipperMaker  (protégé par <AuthGuard>)
  /maker             →   MakerListPage   (liste, publique une fois connecté)
  /maker/new         →   MakerEditorPage mode="create"
  /maker/:id         →   MakerEditorPage mode="edit"
/playfield           → Playfield        (jeu principal, plateau fixe)
/playfield/:levelId  → PlayfieldMaker  (jeu d'un niveau custom, PAS protégé)
```

`/maker/*` est enveloppé par le composant `AuthGuard` existant (`frontend/src/components/auth/AuthGuard.tsx`, déjà utilisé pour `/dashboard`) : un utilisateur non connecté est redirigé vers `/login?redirect=/maker...`, puis renvoyé automatiquement sur `/maker` après connexion (le paramètre `redirect` est consommé de façon générique par `Login.tsx`, aucun changement n'a été nécessaire côté login).

`/playfield/:levelId` reste volontairement public : n'importe qui peut jouer un niveau, seule sa création/édition/suppression nécessite un compte.

### Paramètres de route

| Route | Paramètre | Type | Description |
|-------|-----------|------|-------------|
| `/maker/:id` | `id` | `string` (UUID) | Niveau à éditer — l'utilisateur doit en être propriétaire |
| `/playfield/:levelId` | `levelId` | `string` (UUID) | ID du niveau en BDD |

---

## 3. Flux de données global

```
[Utilisateur crée un niveau] (connecté, /maker/new)
        ↓
MakerEditorPage (mode="create")
  ├── useMakerStore (état local) — resetLevel() au montage
  │     ├── elements[]    ← liste des obstacles
  │     ├── levelName     ← nom du niveau
  │     └── levelId       ← null tant que non sauvegardé
  ├── EditorCanvas (Canvas 3D)
  │     ├── PinballMVPMaker (plateau visuel, sans physique)
  │     └── PlayfieldElement[] (obstacles avec PivotControls)
  └── handleSave()
        ├── Capture screenshot (WebGL → base64 JPEG)
        ├── credentials: "include" (cookie de session requis)
        └── levelId === null ? POST /api/levels : PUT /api/levels/:levelId
                ↓
        [Base de données PostgreSQL]
              table: levels
              ├── id (UUID)
              ├── name
              ├── userId  ← session.user.id à la création, jamais modifiable ensuite
              ├── elements (JSONB)
              └── screenshotUrl

[Utilisateur modifie un niveau existant] (connecté, /maker/:id, propriétaire)
        ↓
MakerEditorPage (mode="edit")
  ├── GET /api/levels/:id (credentials: include) → si isOwner=false, retour à /maker
  ├── loadLevel(data) → store rempli, levelId = data.id
  └── handleSave() → PUT /api/levels/:levelId (403 si non propriétaire)

[Utilisateur joue un niveau] (public, pas de connexion requise)
        ↓
LevelList → clic "Jouer" → navigate(/playfield/:levelId)
        ↓
PlayfieldMaker
  ├── GET /api/levels/:id → elements[]
  ├── Canvas 3D + Physics (Rapier)
  │     ├── PinballMVPMaker withPhysics (plateau + physique + flippers + gate)
  │     ├── PhysicsPlayfieldElement[] (obstacles avec RigidBody)
  │     └── Ball (bille physique)
  └── Inputs clavier (S/Q/D/Space)
```

---

## 4. Store — `useMakerStore`

**Fichier :** `frontend/src/store/useMakerStore.ts`

Store Zustand global pour l'état de l'éditeur. Persiste en mémoire le temps de la session.

### Types exportés

#### `MakerElement`
Représente un obstacle placé sur le plateau.

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `id` | `string` | `crypto.randomUUID()` | Identifiant unique |
| `name` | `string` | Label du type (config) | Nom affiché dans l'inspecteur |
| `type` | `MakerElementType` (`"cylinder" \| "box" \| "sphere"`) | — | Forme géométrique, voir [§5](#5-config-centrale--configmakerelementconfigts) |
| `position` | `[number, number, number]` | `[0, 0, 0]` | Position XYZ dans la scène |
| `rotation` | `[number, number, number]` | `[0, 0, 0]` | Rotation en radians (Euler XYZ) |
| `scale` | `[number, number, number]` | `[1, 1, 1]` | Scale XYZ |
| `color` | `string?` | selon type (config) | Couleur hex |
| `roughness` | `number?` | selon type (config) | 0 = brillant, 1 = mat |
| `metalness` | `number?` | selon type (config) | 0 = plastique, 1 = métal |
| `isBumper` | `boolean?` | `false` | Active l'effet rebond physique |
| `bumpStrength` | `number?` | `15` | Force d'impulsion du bumper |

> Un élément dont le `type` n'est reconnu par aucune entrée de `MAKER_ELEMENT_CONFIG` (niveau sauvegardé par une version plus récente du Maker) n'est **jamais filtré** par le store — il reste tel quel dans `elements[]`. Seul le rendu 3D (`PlayfieldElement`/`PhysicsPlayfieldElement`) l'ignore proprement. Voir [§5](#5-config-centrale--configmakerelementconfigts).

#### `LevelListItem`
Données minimales pour la liste des niveaux.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID du niveau |
| `name` | `string` | Nom du niveau |
| `screenshotUrl` | `string \| null` | URL relative de la miniature |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |
| `isOwner` | `boolean` | Calculé côté backend — `true` si l'utilisateur connecté est l'auteur |

#### `LevelDetail`
Étend `LevelListItem` avec les éléments complets.

| Champ | Type | Description |
|-------|------|-------------|
| `elements` | `MakerElement[]` | Tableau des obstacles du niveau |

### État du store

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `elements` | `MakerElement[]` | `[]` | Obstacles du niveau en cours d'édition |
| `selectedElementId` | `string \| null` | `null` | ID de l'élément sélectionné dans l'éditeur |
| `levelName` | `string` | `"Mon niveau"` | Nom du niveau en cours d'édition |
| `levelId` | `string \| null` | `null` | `null` = brouillon jamais sauvegardé (POST) ; sinon = niveau existant en cours d'édition (PUT) |

### Actions

#### `addElement(type)`
- **Params :** `type: MakerElementType`
- Lit `MAKER_ELEMENT_CONFIG[type]` pour le nom, la couleur, la rugosité, la métalité et la force de bumper par défaut
- Génère un UUID via `crypto.randomUUID()`
- Ajoute l'élément à `elements[]` et le sélectionne automatiquement

#### `updateElementTransform(id, position, rotation, scale)`
- Met à jour la position, rotation et scale d'un élément par son ID
- Appelé à chaque frame de drag du gizmo PivotControls

#### `updateElementProperties(id, properties)`
- Merge partiel sur un élément (couleur, roughness, metalness, isBumper, bumpStrength)
- Appelé par les inputs du panneau Inspecteur

#### `removeElement(id)`
- Supprime l'élément du tableau ; si sélectionné → `selectedElementId = null`

#### `setSelectedElementId(id)` / `setLevelName(name)` / `setLevelId(id)`
- Setters directs. `setLevelId` est utilisé après un `POST` réussi pour que la sauvegarde suivante devienne un `PUT` (voir [§6](#6-pages-éditeur--flippermakertsx-et-sous-pages)).

#### `loadLevel(level)`
- **Param :** `level: LevelDetail`
- Remplace tout l'état par le niveau chargé depuis l'API (utilisé par `MakerEditorPage` en mode édition)
- Ne filtre **jamais** les éléments dont le `type` est inconnu — passe-plat volontaire (voir [§5](#5-config-centrale--configmakerelementconfigts))

#### `resetLevel()`
- Remet le store à zéro (nouveau niveau vide, `levelId: null`)
- Appelé au montage de `MakerEditorPage` en mode `"create"`

---

## 5. Config centrale — `config/makerElementConfig.ts`

**Fichier :** `frontend/src/config/makerElementConfig.ts`

Source unique de vérité pour les types d'éléments du Maker, consommée par 4 endroits qui dupliquaient auparavant ces valeurs : la palette (`MakerPalette.tsx`), les valeurs par défaut du store (`addElement`), le rendu éditeur (`PlayfieldElement.tsx`) et le rendu physique (`PhysicsPlayfieldElement.tsx`).

```ts
export const MAKER_ELEMENT_TYPES = ["cylinder", "box", "sphere"] as const;
export type MakerElementType = typeof MAKER_ELEMENT_TYPES[number];

export const MAKER_ELEMENT_CONFIG: Record<MakerElementType, MakerElementTypeConfig> = {
  cylinder: { label, emoji, paletteColorClass, selectedColor, geometry, defaults },
  box: { /* ... */ },
  sphere: { /* ... */ },
};

export function isMakerElementType(value: unknown): value is MakerElementType;
export function getMakerElementConfig(type: string): MakerElementTypeConfig | undefined;
```

**Ajouter un type d'élément** = une entrée dans `MAKER_ELEMENT_TYPES` + une entrée dans `MAKER_ELEMENT_CONFIG`. Aucun autre fichier frontend n'a besoin d'être modifié.

> ⚠️ Pas de package partagé entre frontend et backend : la même liste de types vit indépendamment dans `backend/src/domain/maker-elements.ts` (whitelist Zod utilisée par `POST`/`PUT /api/levels`). Ajouter un type nécessite donc de mettre à jour **les deux fichiers**. C'est une limitation connue, documentée en commentaire dans les deux fichiers.

### Lecture tolérante, écriture stricte

- **Lecture/rendu :** `getMakerElementConfig(type)` retourne `undefined` pour un type inconnu. `PlayfieldElement`/`PhysicsPlayfieldElement` ignorent alors proprement l'élément (pas de crash du Canvas). Le store (`loadLevel`) ne filtre jamais ces éléments — ils survivent à un aller-retour charger/modifier-autre-chose/sauvegarder.
- **Écriture (`POST`/`PUT /api/levels`) :** le backend valide strictement `type` contre sa whitelist Zod. Un niveau contenant un élément dont le type n'est pas (encore) reconnu par le backend actuel sera **rejeté (400)** s'il est re-sauvegardé tel quel. C'est une frontière d'intégrité assumée, pas un oubli : voir `backend/src/domain/maker-elements.ts`.

`ElementGeometry.tsx` (`frontend/src/components/maker/ElementGeometry.tsx`) traduit `config.geometry` en balise Three.js (`cylinderGeometry`/`boxGeometry`/`sphereGeometry`) — seul endroit qui connaît ce mapping, partagé par les deux modes de rendu.

---

## 6. Pages éditeur — `FlipperMaker.tsx` et sous-pages

**Fichier racine :** `frontend/src/pages/FlipperMaker.tsx` — un simple routeur imbriqué monté sous `/maker/*` :

```tsx
<Routes>
  <Route index element={<MakerListPage />} />
  <Route path="new" element={<MakerEditorPage mode="create" />} />
  <Route path=":id" element={<MakerEditorPage mode="edit" />} />
</Routes>
```

### `pages/maker/MakerListPage.tsx`

Header (titre + bouton "Créer un niveau" → `navigate("new")`) + `<LevelList />`.

### `components/maker/LevelList.tsx`

Fetch `GET /api/levels` (`credentials: "include"`, pour que `isOwner` reflète la session) et affiche **deux sections séparées** — "Mes niveaux" (`isOwner === true`) puis "Tous les niveaux" (le reste) — plutôt qu'une grille unique mélangée : chaque section a des cartes de forme homogène (avec ou sans boutons "Modifier"/"Supprimer"), ce qui évite un décalage visuel entre cartes de tailles différentes dans une même rangée. Gère aussi la suppression (`window.confirm` puis `DELETE /api/levels/:id`, retire la card localement sur `204`).

### `components/maker/LevelCard.tsx`

Une carte de niveau : miniature, nom, date, bouton "Jouer" (toujours visible), boutons "Modifier"/"Supprimer" (visibles **uniquement si `level.isOwner === true`**, calculé côté backend).

### `pages/maker/MakerEditorPage.tsx`

Remplace l'ancien composant `Editor`. Prend une prop `mode: "create" | "edit"`.

**Montage :**
- `mode="create"` → `resetLevel()`.
- `mode="edit"` → `GET /api/levels/:id` (`credentials: "include"`) ; si erreur ou `isOwner === false` → retour à `/maker` (défense en profondeur, le backend refuse de toute façon) ; sinon `loadLevel(data)`.

**`handleSave()` :**
```
1. Vérification : levelName.trim() non vide
2. captureRef.current?.() → screenshot base64
3. method = levelId ? "PUT" : "POST" ; url = levelId ? `/api/levels/${levelId}` : "/api/levels"
4. fetch(url, { method, credentials: "include", body: { name, elements, screenshot } })
5. 401 → redirection vers /login?redirect=...
6. 403 → saveStatus="forbidden" ("Vous ne pouvez modifier que vos propres niveaux")
7. Succès sur un POST → setLevelId(body.id) (la sauvegarde suivante devient un PUT)
8. Succès → saveStatus="saved" (2s) / Erreur générique → saveStatus="error" (3s)
```

**Composition visuelle** (inchangée) :

```
┌──────────────┬──────────────────────────┬───────────────┐
│ PANNEAU      │   EditorCanvas           │  Inspector    │
│ GAUCHE       │                          │  (droit)      │
│ ← Retour     │  PinballMVPMaker         │ Position X Y Z│
│ Nom niveau   │  PlayfieldElement[]      │ Rotation X Y Z│
│ [Sauvegarder]│  OrbitControls           │ Scale X Y Z   │
│ MakerPalette │  Environment "city"      │ Couleur       │
│ [Navigation] │                          │ Roughness/Met.│
│              │                          │ isBumper      │
│              │                          │ [Supprimer]   │
└──────────────┴──────────────────────────┴───────────────┘
```

### `components/maker/MakerPalette.tsx`

Génère les boutons d'ajout en itérant sur `MAKER_ELEMENT_TYPES` (voir [§5](#5-config-centrale--configmakerelementconfigts)) — plus de boutons codés en dur par type.

### `components/maker/Inspector.tsx`

Panneau droit (position/rotation/scale/couleur/matériau/bumper/suppression), extrait tel quel. Le label du type utilise `getMakerElementConfig(type)?.label ?? type` pour rester lisible même sur un type inconnu.

### `components/maker/EditorCanvas.tsx`

Le `<Canvas>` R3F (lumières, plateau, éléments, `ScreenshotCapture`, `OrbitControls`).

### `components/maker/ScreenshotCapture.tsx`

Inchangé — capture hors-écran 300×480 indépendante de la résolution d'écran.

---

## 7. Page gameplay — `PlayfieldMaker.tsx`

**Fichier :** `frontend/src/pages/PlayfieldMaker.tsx`
**Route :** `/playfield/:levelId` — **publique**, aucune connexion requise.

Page de jeu pour un niveau custom. Combine physique Rapier, balle, flippers, et inputs clavier. Charge le niveau via `GET /api/levels/:levelId` (sans `credentials`, cette page ne calcule pas `isOwner` et n'en a pas besoin) puis extrait `data.elements`.

*(Section inchangée par rapport à la version précédente du document — `FixedCamera`, `Scene`, mécanique de démarrage clavier, mapping des touches.)*

---

## 8. Composant modèle 3D — `PinballMVP_Maker.tsx`

*(Inchangé — voir le fichier `frontend/src/components/models/PinballMVP_Maker.tsx` pour le détail des nodes GLB, `boardMeshes`, la mécanique de la gate et des flippers.)*

---

## 9. Composant éditeur — `PlayfieldElement.tsx`

**Fichier :** `frontend/src/components/maker/PlayfieldElement.tsx`

Rendu d'un obstacle dans l'éditeur. Gère la sélection et le drag via `PivotControls`. Le hack `noopRaycast` (mesh invisible au raycaster quand sélectionné, pour ne pas voler les clics aux flèches du gizmo) est inchangé.

`renderGeometry()` est maintenant piloté par la config (voir [§5](#5-config-centrale--configmakerelementconfigts)) :
```ts
const config = getMakerElementConfig(element.type);
if (!config) return null; // type inconnu → pas de crash
const color = isSelected ? config.selectedColor : (element.color ?? config.defaults.color);
// <ElementGeometry type={element.type} /> pour la géométrie
```

---

## 10. Composant gameplay — `PhysicsPlayfieldElement.tsx`

**Fichier :** `frontend/src/components/maker/PhysicsPlayfieldElement.tsx`

Rendu d'un obstacle avec physique Rapier. Même traitement que l'éditeur : `if (!getMakerElementConfig(element.type)) return null;` avant tout `RigidBody`, et les valeurs par défaut (`color`/`roughness`/`metalness`/`bumpStrength`) viennent désormais de `config.defaults` — ce qui unifie trois jeux de valeurs par défaut auparavant divergents entre le store, l'éditeur et la physique.

---

## 11. Backend — Schema BDD

**Fichier :** `backend/src/db/schema.ts` (Drizzle ORM)

### Table `levels`

| Colonne | Type SQL | Description |
|---------|----------|--------------|
| `id` | `text PRIMARY KEY` | UUID généré côté backend |
| `name` | `text NOT NULL` | Nom du niveau |
| `userId` | `text REFERENCES users(id) SET NULL` | Auteur — renseigné à la création depuis la session, jamais modifiable ensuite |
| `elements` | `jsonb NOT NULL DEFAULT []` | Tableau `MakerElement[]` sérialisé |
| `screenshotUrl` | `text` | Chemin relatif `/screenshots/<id>.jpg` |
| `createdAt` / `updatedAt` | `timestamp with timezone` | Auto `NOW()` |

**Index :** `levels_user_id_idx`, `levels_created_at_idx`

---

## 12. Backend — Routes API

**Fichier :** `backend/src/routes/level-routes.ts` (extrait de `app.ts`, suit le même pattern que `leaderboard-routes.ts`/`score-claim-routes.ts` — `registerLevelRoutes({ app, db, getSession, screenshotsDir })`).

Validation des éléments : `backend/src/domain/maker-elements.ts` (schéma Zod, voir [§5](#5-config-centrale--configmakerelementconfigts)).

| Route | Auth | Propriétaire | Rate-limit |
|-------|------|---------------|------------|
| `GET /api/levels` | optionnelle (pour `isOwner`) | — | non |
| `GET /api/levels/:id` | optionnelle | — | non |
| `POST /api/levels` | **requise** (401 sinon) | — (nouvelle ressource) | 20 / 10 min / IP |
| `PUT /api/levels/:id` | **requise** (401 sinon) | 403 si non propriétaire, 404 si absent | 30 / 10 min / IP |
| `DELETE /api/levels/:id` | **requise** (401 sinon) | 403 si non propriétaire | 20 / 10 min / IP |

`isOwner` est **calculé côté serveur** (`session?.user.id === level.userId`) et ajouté à chaque objet retourné par `GET` ; le `userId` brut n'est **jamais** exposé dans les réponses JSON.

### `GET /api/levels`

Liste tous les niveaux, triés par date de création décroissante. Réponse : `LevelListItem[]` (sans `elements`).

### `GET /api/levels/:id`

Réponse : `LevelDetail` (avec `elements`, tel quel — y compris un type d'élément inconnu du schéma actuel, voir [§5](#5-config-centrale--configmakerelementconfigts)). `404 { error: "level_not_found" }` si inexistant.

### `POST /api/levels`

**Auth requise.** Body : `{ name, elements, screenshot? }`. Valide `name`/`elements` via `parseLevelWritePayload` (Zod). Insère `userId: session.user.id`. Traite le screenshot comme avant (`data:image/jpeg;base64,...` → fichier local `screenshotsDir/<id>.jpg`).

**Erreurs :** `401 authentication_required`, `400 level_name_required`, `400 level_elements_invalid`.
**Réponse :** `201 LevelListItem` (avec `isOwner: true`).

### `PUT /api/levels/:id` (nouveau)

**Auth requise + propriétaire.** Même validation que `POST`. Remplace `name`/`elements`/`updatedAt` ; remplace le fichier screenshot si un nouveau est fourni (l'ancien est supprimé).

**Erreurs :** `401`, `403 level_forbidden`, `404 level_not_found`, `400 level_elements_invalid`.
**Réponse :** `200 LevelListItem`.

### `DELETE /api/levels/:id`

**Auth requise + propriétaire** (avant ce refactor : aucune vérification). Supprime le niveau et son screenshot associé.

**Erreurs :** `401`, `403 level_forbidden`, `404 level_not_found`.
**Réponse :** `204 No Content`.

### Fichiers statiques screenshots

`GET /screenshots/<id>.jpg`, servi depuis `screenshotsDir` (`<cwd>/public/screenshots`), inchangé.

---

## 13. Utilitaire — `lib/api.ts`

*(Inchangé — voir `frontend/src/lib/api.ts` pour `resolveApiUrl()`/`apiEndpoint()`.)*

---

## 14. Relations entre fichiers

```
FlipperApp.tsx
  ├── /maker/* → AuthGuard → FlipperMaker.tsx (routeur imbriqué)
  │     ├── /        → MakerListPage.tsx
  │     │                ├── LevelList.tsx (fetch + suppression)
  │     │                └── LevelCard.tsx
  │     ├── /new     → MakerEditorPage.tsx (mode="create")
  │     └── /:id     → MakerEditorPage.tsx (mode="edit")
  │            ├── useMakerStore.ts (state)
  │            ├── config/makerElementConfig.ts (défauts, types, palette)
  │            ├── EditorCanvas.tsx
  │            │     └── PlayfieldElement.tsx (PivotControls)
  │            │           ├── ElementGeometry.tsx
  │            │           └── useMakerStore.ts
  │            ├── MakerPalette.tsx
  │            └── Inspector.tsx
  │
  └── /playfield/:id → PlayfieldMaker.tsx (public)
        ├── lib/api.ts (fetch level)
        ├── useGameStore.ts (isPlaying, startGame, ballInLauncher)
        ├── useInputStore.ts (buttons.start)
        ├── useKeyboardControls.ts (listeners clavier)
        ├── PinballMVP_Maker.tsx (withPhysics=true)
        │     ├── useGameStore.ts (ballInLauncher, setBallInLauncher)
        │     └── Flipper.tsx (kinématique)
        ├── PhysicsPlayfieldElement.tsx (RigidBody obstacles)
        │     └── ElementGeometry.tsx
        └── Ball.tsx

backend/src/app.ts
  └── registerLevelRoutes (routes/level-routes.ts)
        └── parseLevelWritePayload (domain/maker-elements.ts, Zod)
```

---

## 15. Cycle complet : Créer → Sauvegarder → Modifier → Jouer → Supprimer

### Étape 1 — Connexion et création

1. `GET /maker` sans session → `AuthGuard` redirige vers `/login?redirect=/maker`
2. Connexion → retour automatique sur `/maker` → `MakerListPage`
3. Clic "Créer un niveau" → `navigate("new")` → `MakerEditorPage` (mode `create`) → `resetLevel()`
4. Clic "+ Cylindre/Cube/Sphère" → `addElement(type)` (défauts lus dans `MAKER_ELEMENT_CONFIG`)
5. Drag du gizmo / panneau Inspecteur → `updateElementTransform()` / `updateElementProperties()`

### Étape 2 — Sauvegarde (création)

1. Saisir un nom → `setLevelName(name)`
2. Clic "Sauvegarder" → `handleSave()` → `levelId === null` → `POST /api/levels { name, elements, screenshot }` (`credentials: include`)
3. Backend : vérifie la session, valide `elements` (Zod), génère UUID, écrit le screenshot, insère avec `userId = session.user.id`
4. Réponse `201` → `setLevelId(body.id)` (les sauvegardes suivantes deviendront des `PUT`)

### Étape 3 — Liste, modification, suppression

1. `GET /api/levels` (`credentials: include`) → chaque niveau porte `isOwner`
2. Niveau **dont je suis propriétaire** → boutons "Modifier"/"Supprimer" visibles
   - "Modifier" → `navigate(id)` → `MakerEditorPage` (mode `edit`) → `GET /api/levels/:id` → `loadLevel(data)` → `handleSave()` fait désormais un `PUT`
   - "Supprimer" → confirmation → `DELETE /api/levels/:id` → `204` → retiré de la liste
3. Niveau **d'un autre utilisateur** → seul "Jouer" est visible ; un appel direct à l'API en `PUT`/`DELETE` recevrait `403 level_forbidden`

### Étape 4 — Jouer (public, sans connexion)

1. Clic "Jouer" → `navigate(/playfield/:levelId)` (pas de garde d'authentification)
2. `PlayfieldMaker` → `GET /api/levels/:levelId` → `elements[]`
3. Canvas Rapier (`gravity: [0, -80, 20]`) → `PinballMVPMaker withPhysics` (plateau + gate + flippers) + `PhysicsPlayfieldElement` par obstacle
4. **S** démarre la partie, **Q/D** les flippers, **Space** (maintenu) lance la bille ; bumpers = `applyImpulse` de répulsion à la collision

---

*Document mis à jour le 2026-07-05 (refonte modularité/config/auth/CRUD du Maker).*
