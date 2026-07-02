# Système Maker — Documentation complète

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Routage](#2-routage)
3. [Flux de données global](#3-flux-de-données-global)
4. [Store — `useMakerStore`](#4-store--usemakerstore)
5. [Page éditeur — `FlipperMaker.tsx`](#5-page-éditeur--flippermakertsx)
6. [Page gameplay — `PlayfieldMaker.tsx`](#6-page-gameplay--playfieldmakertsx)
7. [Composant modèle 3D — `PinballMVP_Maker.tsx`](#7-composant-modèle-3d--pinballmvp_makertsx)
8. [Composant éditeur — `PlayfieldElement.tsx`](#8-composant-éditeur--playfieldelementtsx)
9. [Composant gameplay — `PhysicsPlayfieldElement.tsx`](#9-composant-gameplay--physicsplayfieldelementtsx)
10. [Backend — Schema BDD](#10-backend--schema-bdd)
11. [Backend — Routes API](#11-backend--routes-api)
12. [Utilitaire — `lib/api.ts`](#12-utilitaire--libapiys)
13. [Relations entre fichiers](#13-relations-entre-fichiers)
14. [Cycle complet : Créer → Sauvegarder → Charger → Jouer](#14-cycle-complet--créer--sauvegarder--charger--jouer)

---

## 1. Vue d'ensemble

Le système Maker permet de :
- **Créer** un niveau personnalisé en plaçant des obstacles 3D sur le plateau
- **Sauvegarder** ce niveau en base de données (avec screenshot)
- **Lister** les niveaux existants
- **Jouer** un niveau avec toute la physique active (balle, flippers, bumpers)

Il existe en **deux modes** distincts qui partagent les mêmes données :

| Mode | Route | Composant plateau | Physique |
|------|-------|-------------------|----------|
| Éditeur | `/maker` | `PinballMVPMaker` (sans prop) | Aucune — PivotControls |
| Gameplay | `/playfield/:levelId` | `PinballMVPMaker withPhysics` | Rapier complet |

---

## 2. Routage

**Fichier :** `frontend/src/App.tsx`

```
/              → Home
/maker         → FlipperMaker     (éditeur + liste des niveaux)
/playfield     → Playfield        (jeu principal, plateau fixe)
/playfield/:levelId → PlayfieldMaker  (jeu d'un niveau custom)
```

### Paramètres de route

| Route | Paramètre | Type | Description |
|-------|-----------|------|-------------|
| `/playfield/:levelId` | `levelId` | `string` (UUID) | ID du niveau en BDD |

---

## 3. Flux de données global

```
[Utilisateur crée un niveau]
        ↓
FlipperMaker (éditeur)
  ├── useMakerStore (état local)
  │     ├── elements[]    ← liste des obstacles
  │     └── levelName     ← nom du niveau
  ├── Canvas 3D
  │     ├── PinballMVPMaker (plateau visuel, sans physique)
  │     └── PlayfieldElement[] (obstacles avec PivotControls)
  └── handleSave()
        ├── Capture screenshot (WebGL → base64 JPEG)
        └── POST /api/levels { name, elements, screenshot }
                ↓
        [Base de données PostgreSQL]
              table: levels
              ├── id (UUID)
              ├── name
              ├── elements (JSONB)
              └── screenshotUrl

[Utilisateur joue un niveau]
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
| `name` | `string` | `"Cylindre 1"` etc. | Nom affiché dans l'inspecteur |
| `type` | `"cylinder" \| "box" \| "sphere"` | — | Forme géométrique |
| `position` | `[number, number, number]` | `[0, 0, 0]` | Position XYZ dans la scène |
| `rotation` | `[number, number, number]` | `[0, 0, 0]` | Rotation en radians (Euler XYZ) |
| `scale` | `[number, number, number]` | `[1, 1, 1]` | Scale XYZ |
| `color` | `string?` | bleu/rouge/vert selon type | Couleur hex |
| `roughness` | `number?` | 0.2–0.4 selon type | 0 = brillant, 1 = mat |
| `metalness` | `number?` | 0.1–0.9 selon type | 0 = plastique, 1 = métal |
| `isBumper` | `boolean?` | `false` | Active l'effet rebond physique |
| `bumpStrength` | `number?` | `15` | Force d'impulsion du bumper |

#### `LevelListItem`
Données minimales pour la liste des niveaux.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID du niveau |
| `name` | `string` | Nom du niveau |
| `screenshotUrl` | `string \| null` | URL relative de la miniature |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

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
| `levelId` | `string \| null` | `null` | ID BDD si niveau chargé (non utilisé activement) |

### Actions

#### `addElement(type)`
- **Params :** `type: "cylinder" | "box" | "sphere"`
- Calcule un nom auto (`Cylindre 1`, `Cube 2`, etc.) en comptant les éléments existants du même type
- Génère un UUID via `crypto.randomUUID()`
- Assigne couleur/roughness/metalness par défaut selon le type
- Ajoute l'élément à `elements[]` et le sélectionne automatiquement

#### `updateElementTransform(id, position, rotation, scale)`
- **Params :** `id: string`, `position/rotation/scale: [number, number, number]`
- Met à jour la position, rotation et scale d'un élément par son ID
- Appelé à chaque frame de drag du gizmo PivotControls

#### `updateElementProperties(id, properties)`
- **Params :** `id: string`, `properties: Partial<MakerElement>`
- Merge partiel sur un élément (couleur, roughness, metalness, isBumper, bumpStrength)
- Appelé par les inputs du panneau Inspecteur

#### `removeElement(id)`
- Supprime l'élément du tableau
- Si l'élément supprimé était sélectionné → `selectedElementId = null`

#### `setSelectedElementId(id)`
- Sélectionne ou désélectionne un élément (`null` pour désélectionner)

#### `setLevelName(name)`
- Met à jour le nom du niveau

#### `loadLevel(level)`
- **Param :** `level: LevelDetail`
- Remplace tout l'état par le niveau chargé depuis l'API
- Utilisé pour éditer un niveau existant (non utilisé actuellement depuis le flux principal — le gameplay charge directement via fetch)

#### `resetLevel()`
- Remet le store à zéro (nouveau niveau vide)
- Appelé quand l'utilisateur clique "Créer un niveau"

---

## 5. Page éditeur — `FlipperMaker.tsx`

**Fichier :** `frontend/src/pages/FlipperMaker.tsx`
**Route :** `/maker`

Page principale du maker. Gère deux vues avec un simple booléen `isEditing`.

```
FlipperMaker
├── isEditing = false → <LevelList onCreate={() => setIsEditing(true)} />
└── isEditing = true  → <Editor onBack={() => setIsEditing(false)} />
```

### Sous-composant : `LevelList`

**Props :** `{ onCreate: () => void }`

Liste tous les niveaux depuis l'API et permet de jouer ou créer.

| Élément | Comportement |
|---------|-------------|
| Bouton "Créer un niveau" | Appelle `resetLevel()` puis `onCreate()` → passe en mode éditeur |
| Card niveau → bouton "Jouer" | `navigate(/playfield/${level.id})` |
| Miniature | `<img src={apiEndpoint(level.screenshotUrl)} />` si screenshot, sinon placeholder |

**Fetch au montage :**
```
GET /api/levels → LevelListItem[]
```

### Sous-composant : `ScreenshotCapture`

**Props :** `{ onReady: (fn: () => string) => void }`

Composant interne au `<Canvas>`. Au montage, expose via `onReady` une fonction de capture.

**Fonctionnement de la capture :**
1. Sauvegarde la position/rotation de la caméra courante
2. Positionne la caméra en vue overhead fixe : `position(0.2, 70, 15)`, `lookAt(0.5, -5.0, 10)`
3. Appelle `gl.render(scene, camera)` pour forcer un rendu
4. Extrait le canvas via `gl.domElement.toDataURL("image/jpeg", 0.8)`
5. Restaure la position/rotation originale de la caméra
6. Retourne le Data URL base64

> Nécessite `preserveDrawingBuffer: true` sur le `<Canvas>` pour pouvoir lire les pixels après le rendu.

### Sous-composant : `Editor`

**Props :** `{ onBack: () => void }`

L'interface d'édition 3D complète.

**State local :**
- `saveStatus: "idle" | "saving" | "saved" | "error"` — état du bouton de sauvegarde
- `captureRef: MutableRefObject<(() => string) | null>` — référence vers la fonction de capture screenshot

**Store consommé :**
- `elements`, `addElement`, `removeElement`
- `selectedElementId`, `setSelectedElementId`
- `updateElementTransform`, `updateElementProperties`
- `levelName`, `setLevelName`

**Structure de l'interface :**

```
┌──────────────┬──────────────────────────┬───────────────┐
│ PANNEAU      │   VUE 3D (Canvas)        │  INSPECTEUR   │
│ GAUCHE       │                          │  DROIT        │
│              │  PinballMVPMaker         │               │
│ ← Retour     │  PlayfieldElement[]      │ Position X Y Z│
│ Nom niveau   │  OrbitControls           │ Rotation X Y Z│
│ [Sauvegarder]│  Environment "city"      │ Scale X Y Z   │
│              │                          │ Couleur       │
│ + Cylindre   │                          │ Roughness     │
│ + Cube       │                          │ Metalness     │
│ + Sphère     │                          │ isBumper      │
│              │                          │ bumpStrength  │
│ [Navigation] │                          │ [Supprimer]   │
└──────────────┴──────────────────────────┴───────────────┘
```

**Fonction `handleSave()` :**
```
1. Vérification : levelName.trim() non vide
2. setSaveStatus("saving")
3. captureRef.current?.() → screenshot base64
4. POST /api/levels { name: levelName, elements, screenshot }
5. Succès → setSaveStatus("saved") → reset "idle" après 2s
6. Erreur  → setSaveStatus("error")  → reset "idle" après 3s
```

**Helpers de transformation (panneau Inspecteur) :**

| Fonction | Params | Description |
|----------|--------|-------------|
| `updatePosition(axis, val)` | `axis: 0\|1\|2`, `val: number` | Modifie X, Y ou Z de la position |
| `updateRotation(axis, valDeg)` | `axis: 0\|1\|2`, `valDeg: number` | Convertit degrés → radians, met à jour la rotation |
| `updateScale(axis, val)` | `axis: 0\|1\|2`, `val: number` | Modifie X, Y ou Z du scale |

**Helpers de conversion :**
- `radToDeg(rad)` → `Math.round(rad * 180 / Math.PI)` — pour afficher en degrés dans l'UI
- `degToRad(deg)` → `deg * Math.PI / 180` — pour stocker en radians dans le store

**Canvas (éditeur) :**
```tsx
<Canvas
  camera={{ position: [0.2, 56.7, 29.5], fov: 45 }}
  gl={{ preserveDrawingBuffer: true }}       // requis pour screenshot
  onPointerMissed={() => setSelectedElementId(null)}  // clic vide = désélection
  shadows
>
  <PinballMVPMaker />                  // plateau visuel, sans physique
  {elements.map(el => <PlayfieldElement key={el.id} element={el} />)}
  <ScreenshotCapture onReady={handleScreenshotReady} />
  <OrbitControls target={[0.5, -5.0, 4.7]} makeDefault />
</Canvas>
```

---

## 6. Page gameplay — `PlayfieldMaker.tsx`

**Fichier :** `frontend/src/pages/PlayfieldMaker.tsx`
**Route :** `/playfield/:levelId`

Page de jeu pour un niveau custom. Combine physique Rapier, balle, flippers, et inputs clavier.

### Sous-composant : `FixedCamera`

Composant R3F sans rendu visuel. Verrouille la caméra en position overhead via `useFrame` à chaque frame.

```ts
camera.position.set(0.2, 56.7, 29.5)
camera.lookAt(0.5, -5.0, 4.7)
```

### Sous-composant : `Scene`

**Props :** `{ elements: MakerElement[] }`

Contient la scène 3D complète enveloppée dans `<Suspense>`.

```tsx
<Suspense fallback={null}>
  <PinballMVPMaker withPhysics />          // plateau + physique + gate + flippers
  {elements.map(el => <PhysicsPlayfieldElement key={el.id} element={el} />)}
  <Ball position={[12.75, -2.3, 30.46]} />  // balle dans le plunger
</Suspense>
```

### Composant principal `PlayfieldMaker`

**State local :**
- `elements: MakerElement[]` — obstacles chargés depuis l'API

**Stores consommés :**
- `useInputStore` → `startPressed` (bouton S), `updateInputs`
- `useGameStore` → `startGame`
- `useKeyboardControls()` — enregistre les listeners clavier

**Mécanique de démarrage (touche S) :**
```ts
useEffect(() => {
  if (startPressed) {
    startGame(1)                              // reset complet + isPlaying=true
    updateInputs({ buttons: { start: false } }) // remet S à false
  }
}, [startPressed, startGame, updateInputs])
```
> Contrairement à `Playfield.tsx`, le check `!isPlaying` est retiré : S redémarre la partie même en cours de jeu.

**Chargement du niveau :**
```ts
useEffect(() => {
  if (!levelId) { navigate("/maker"); return }
  fetch(apiEndpoint(`/api/levels/${levelId}`))
    .then(r => r.json())
    .then(data => setElements(Array.isArray(data.elements) ? data.elements : []))
}, [levelId, navigate])
```

**Canvas (gameplay) :**
```tsx
<Canvas dpr={1} shadows camera={{ position: [0.2, 56.7, 29.5], fov: 45 }}>
  <Physics gravity={[0, -80, 20]}>
    <FixedCamera />
    <Scene elements={elements} />
  </Physics>
</Canvas>
```
> `gravity: [0, -80, 20]` — fort Y négatif + Z positif pour simuler l'inclinaison du plateau vers le bas-avant.

**Mapping des touches :**

| Touche | Store | Effet |
|--------|-------|-------|
| S | `buttons.start` | Démarre / redémarre la partie |
| Q | `buttons.left_flipper` | Flipper gauche |
| D | `buttons.right_flipper` | Flipper droit |
| Space (maintenu) | `buttons.launch_ball` | Lance la bille (impulsion) |

---

## 7. Composant modèle 3D — `PinballMVP_Maker.tsx`

**Fichier :** `frontend/src/components/models/PinballMVP_Maker.tsx`
**GLB :** `/models/PinballMVP_Maker-transformed.glb`

**Source unique de vérité** pour le plateau maker. Fonctionne en deux modes via la prop `withPhysics`.

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `withPhysics` | `boolean?` | `false` | Active le mode physique (gameplay) |
| `...props` | `JSX.IntrinsicElements['group']` | — | Passés au `<group>` en mode éditeur |

### Nodes GLB disponibles

| Node | Description |
|------|-------------|
| `coll_maker_playfield_collision` | Surface principale du plateau |
| `coll_maker_gate` | Porte du plunger (gérée dynamiquement) |
| `coll_maker_standard_collision_sidewalls` | Murs latéraux |
| `coll_maker_flipper_left_bottom` | Géométrie flipper gauche |
| `coll_maker_flipper_right_bottom` | Géométrie flipper droit |
| `coll_maker_super_rubber` | Caoutchouc (rebond) |
| `coll_maker_metal` | Pièces métalliques |
| `coll_maker_slingshot_left` | Slingshot gauche |
| `coll_maker_slingshot_right` | Slingshot droit |
| `coll_maker_guidance_right` | Guide droit |
| `coll_maker_guidance_left` | Guide gauche |
| `coll_maker_glass_panel` | Panneau de verre (plafond invisible) |

### `boardMeshes` — tableau central

Défini une seule fois, utilisé pour le rendu visuel ET les colliders physiques :

```ts
const boardMeshes: MeshDef[] = [
  // { geometry, material, position }
  // Tous les meshes sauf coll_maker_gate (géré séparément)
]
```

### Mode éditeur (`withPhysics = false`)

```tsx
<group {...props} dispose={null}>
  {boardMeshes.map(m => <mesh geometry={m.geometry} material={m.material} position={m.position} />)}
  <mesh ... />  // flipper gauche statique
  <mesh ... />  // flipper droit statique
</group>
```
Pas de physique — les flippers sont des meshes statiques, pas de RigidBody.

### Mode gameplay (`withPhysics = true`)

Structure du rendu :

```
Fragment <>
├── Visual meshes (boardMeshes)           // visible, pas de physique directe
├── RigidBody type="fixed" trimesh        // colliders invisibles (boardMeshes + glass panel)
├── Gate sensor (RigidBody sensor)        // détecteur de passage de bille
├── Gate collider (conditionnel)          // apparaît quand !ballInLauncher
├── Flipper left  (composant Flipper)     // kinématique, animé
└── Flipper right (composant Flipper)     // kinématique, animé
```

**Mécanique de la gate (porte du plunger) :**

```
ballInLauncher = true (départ)
       ↓
Sensor invisible à [8.4, -1.6, 5.9]
       ↓ (bille passe → onIntersectionEnter)
setTimeout 500ms → setBallInLauncher(false)
       ↓
Gate apparaît (mesh visible + RigidBody hull)
→ la bille ne peut plus revenir dans le plunger
```

- **Sensor :** `RigidBody type="fixed" sensor` + `CuboidCollider args={[1, 1, 0.2]}` à `rotation={[0, Math.PI/2.6, 0]}`
- **Gate collider conditionnel :** `{!ballInLauncher && <RigidBody type="fixed" colliders="hull">...`}
- **Gate visible :** le mesh `coll_maker_gate` est rendu visible (avec `PaletteMaterial002`) quand il apparaît

**Flippers :**

| Prop `Flipper` | Gauche | Droit |
|----------------|--------|-------|
| `side` | `"left"` | `"right"` |
| `position` | `[-5.001, -2.901, 26.34]` | `[2.787, -2.901, 26.34]` |
| `rotation` | `[0, 0, 0]` | `[0, 0, 0]` |
| `colliderGeometry` | `coll_maker_flipper_left_bottom.geometry` | `coll_maker_flipper_right_bottom.geometry` |
| `visualGeometry` | idem | idem |
| `visualMaterial` | `PaletteMaterial002` | `PaletteMaterial002` |

---

## 8. Composant éditeur — `PlayfieldElement.tsx`

**Fichier :** `frontend/src/components/maker/PlayfieldElement.tsx`

Rendu d'un obstacle dans l'éditeur. Gère la sélection et le drag via `PivotControls`.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `element` | `MakerElement` | L'élément à rendre |

### Fonctionnement du raycast

`noopRaycast` est une fonction qui retourne toujours `null`. Elle est assignée à `mesh.raycast` quand l'élément est sélectionné, pour que le mesh ne "vole" pas les clics destinés aux flèches du gizmo `PivotControls` (qui utilise `depthTest={false}` et peut être "derrière" géométriquement).

### Logique de rendu

```
isSelected = (selectedElementId === element.id)

Si isSelected:
  → PivotControls (gizmo actif)
      matrix = compose(position, rotation, scale)
      onDrag: décompose la matrice → updateElementTransform()
      renderGeometry(disableRaycast=true)  ← mesh invisible au raycaster

Si !isSelected:
  → group à position/rotation/scale
      onClick: stopPropagation + setSelectedElementId(element.id)
      renderGeometry(disableRaycast=false)  ← mesh cliquable
```

### `renderGeometry(disableRaycast)`

Rendu conditionnel selon `element.type` :

| Type | Géométrie | Taille | Couleur sélectionné |
|------|-----------|--------|---------------------|
| `cylinder` | `CylinderGeometry` | r=1.5, h=1, seg=32 | `#ea580c` |
| `box` | `BoxGeometry` | 2×2×2 | `#ea580c` |
| `sphere` | `SphereGeometry` | r=1.2, seg=32 | `#ea580c` |

### `handleDrag(localMatrix)`

Appelé à chaque frame de drag. Décompose la matrice 4x4 locale :
```ts
localMatrix.decompose(pos, quat, scale)
rot = Euler.setFromQuaternion(quat)
updateElementTransform(id, [pos.x,y,z], [rot.x,y,z], [sc.x,y,z])
```

### `PivotControls` config

| Prop | Valeur | Raison |
|------|--------|--------|
| `autoTransform` | `false` | On gère la transformation manuellement via `onDrag` |
| `anchor` | `[0,0,0]` | Gizmo centré sur l'objet |
| `depthTest` | `false` | Gizmo visible à travers les autres meshes |
| `fixed` | `true` | Taille fixe en pixels (ne grossit pas au zoom) |
| `scale` | `75` | Taille du gizmo en pixels |
| `disableSliders` | `true` | Pas de sliders de plan |

---

## 9. Composant gameplay — `PhysicsPlayfieldElement.tsx`

**Fichier :** `frontend/src/components/maker/PhysicsPlayfieldElement.tsx`

Rendu d'un obstacle avec physique Rapier en mode gameplay.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `element` | `MakerElement` | L'élément à rendre (même data que l'éditeur) |

### Structure

```tsx
<RigidBody
  type="fixed"           // corps statique, ne bouge pas
  colliders="hull"       // convex hull auto-calculé depuis le mesh enfant
  position={element.position}
  rotation={element.rotation}
  restitution={isBumper ? 1.2 : 0.3}   // rebond fort si bumper
  onCollisionEnter={handleCollision}
>
  <group scale={element.scale}>
    <mesh>
      {/* geometrie selon element.type */}
      <meshStandardMaterial color/roughness/metalness />
    </mesh>
  </group>
</RigidBody>
```

### Logique bumper `handleCollision`

Déclenchée quand `e.other.rigidBodyObject?.name === "ball"` :

```ts
// Vecteur de répulsion : bumper → bille (normalisé)
dx = ballPos.x - bumperPos.x
dy = ballPos.y - bumperPos.y
dz = ballPos.z - bumperPos.z
len = Math.sqrt(dx²+dy²+dz²) || 1

// Impulse appliquée à la bille
e.other.rigidBody.applyImpulse({
  x: (dx/len) * strength,
  y: (dy/len) * strength,
  z: (dz/len) * strength
}, true)
```

- `strength` = `element.bumpStrength ?? 15`
- Condition de guard : `element.isBumper` doit être `true`, `rigidBodyRef.current` non null

---

## 10. Backend — Schema BDD

**Fichier :** `backend/src/db/schema.ts` (Drizzle ORM)

### Table `levels`

| Colonne | Type SQL | Description |
|---------|----------|-------------|
| `id` | `text PRIMARY KEY` | UUID généré côté backend |
| `name` | `text NOT NULL` | Nom du niveau |
| `userId` | `text REFERENCES users(id) SET NULL` | Auteur (nullable — niveaux anonymes possibles) |
| `elements` | `jsonb NOT NULL DEFAULT []` | Tableau `MakerElement[]` sérialisé |
| `screenshotUrl` | `text` | Chemin relatif `/screenshots/<id>.jpg` |
| `createdAt` | `timestamp with timezone` | Auto `NOW()` |
| `updatedAt` | `timestamp with timezone` | Auto `NOW()` |

**Index :** `levels_user_id_idx`, `levels_created_at_idx`

---

## 11. Backend — Routes API

**Fichier :** `backend/src/app.ts`

### `GET /api/levels`

Liste tous les niveaux, triés par date de création décroissante.

**Réponse :** `LevelListItem[]` (sans `elements` — optimisation)
```json
[
  {
    "id": "uuid",
    "name": "Mon niveau",
    "screenshotUrl": "/screenshots/uuid.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### `GET /api/levels/:id`

Retourne un niveau complet par son ID.

**Params :** `id` (UUID)
**Réponse :** `LevelDetail` (avec `elements`)
**Erreur :** `404 { error: "level_not_found" }` si inexistant

### `POST /api/levels`

Crée un nouveau niveau.

**Body :**
```json
{
  "name": "Mon niveau",
  "elements": [ /* MakerElement[] */ ],
  "screenshot": "data:image/jpeg;base64,..."
}
```

**Traitement du screenshot :**
1. Valide que le Data URL commence par `data:image/jpeg;base64,`
2. Extrait le base64, crée le buffer
3. `mkdir -p screenshotsDir`
4. `writeFile(screenshotsDir/<id>.jpg, buffer)`
5. Stocke `screenshotUrl = /screenshots/<id>.jpg`

**Validations :**
- `name` vide → `400 level_name_required`
- `elements` non-tableau → `400 level_elements_invalid`

**Réponse :** `201 LevelListItem` (sans `elements`)

### `DELETE /api/levels/:id`

Supprime un niveau et son screenshot associé.

**Params :** `id` (UUID)
**Comportement :** Supprime le fichier screenshot si `screenshotUrl` non null (erreur silencieuse si fichier absent)
**Réponse :** `204 No Content`
**Erreur :** `404` si niveau inexistant

### Fichiers statiques screenshots

```
GET /screenshots/<id>.jpg
```
Servi depuis le dossier `screenshotsDir` (configurable via `SCREENSHOTS_DIR` ou `./screenshots`).

---

## 12. Utilitaire — `lib/api.ts`

**Fichier :** `frontend/src/lib/api.ts`

### `resolveApiUrl()`

Résout l'URL de base de l'API par ordre de priorité :
1. `VITE_API_URL` (variable d'environnement)
2. `window.location.protocol + hostname + :3000` (même host, port 3000)
3. `http://localhost:3000` (fallback)

### `apiEndpoint(path)`

Construit une URL absolue complète.
```ts
apiEndpoint("/api/levels") // → "http://localhost:3000/api/levels"
```

---

## 13. Relations entre fichiers

```
App.tsx
  ├── /maker → FlipperMaker.tsx
  │     ├── useMakerStore.ts (state)
  │     ├── lib/api.ts (fetch)
  │     ├── PinballMVP_Maker.tsx (withPhysics=false)
  │     └── PlayfieldElement.tsx (PivotControls)
  │           └── useMakerStore.ts
  │
  └── /playfield/:id → PlayfieldMaker.tsx
        ├── lib/api.ts (fetch level)
        ├── useGameStore.ts (isPlaying, startGame, ballInLauncher)
        ├── useInputStore.ts (buttons.start)
        ├── useKeyboardControls.ts (listeners clavier)
        ├── PinballMVP_Maker.tsx (withPhysics=true)
        │     ├── useGameStore.ts (ballInLauncher, setBallInLauncher)
        │     └── Flipper.tsx (kinematique)
        │           └── useInputStore.ts (left_flipper, right_flipper)
        ├── PhysicsPlayfieldElement.tsx (RigidBody obstacles)
        └── Ball.tsx
              ├── useGameStore.ts (isPlaying, ballInLauncher)
              └── useInputStore.ts (launch_ball)
```

---

## 14. Cycle complet : Créer → Sauvegarder → Charger → Jouer

### Étape 1 — Création

1. `GET /maker` → `FlipperMaker` → `LevelList`
2. Clic "Créer un niveau" → `resetLevel()` → `setIsEditing(true)` → `Editor`
3. Clic "+ Cylindre/Cube/Sphère" → `addElement(type)` → nouvel `MakerElement` dans le store
4. Drag du gizmo → `PivotControls.onDrag` → `updateElementTransform()` → store mis à jour
5. Panneau droit → inputs → `updateElementProperties()` → store mis à jour

### Étape 2 — Sauvegarde

1. Saisir un nom dans l'input → `setLevelName(name)`
2. Clic "Sauvegarder" → `handleSave()`
3. `captureRef.current()` → screenshot en JPEG base64 (vue overhead `y=70`)
4. `POST /api/levels { name, elements, screenshot }`
5. Backend : génère UUID, écrit `<id>.jpg`, insère en BDD → retourne `201`
6. UI : `setSaveStatus("saved")` pendant 2s

### Étape 3 — Liste et navigation

1. `GET /api/levels` au chargement de `LevelList` → affiche les cards
2. Miniature : `<img src={apiEndpoint(level.screenshotUrl)} />`
3. Clic "Jouer" → `navigate(/playfield/${level.id})`

### Étape 4 — Chargement et gameplay

1. `PlayfieldMaker` monte → extrait `levelId` de l'URL
2. `GET /api/levels/:levelId` → `data.elements` → `setElements()`
3. Canvas Rapier monte avec `gravity={[0, -80, 20]}`
4. `PinballMVPMaker withPhysics` rend : plateau + gate sensor + flippers
5. `PhysicsPlayfieldElement` pour chaque obstacle (RigidBody hull)
6. `Ball` en attente (`isPlaying=false` → pas de RigidBody actif)

### Étape 5 — Partie

1. Joueur presse **S** → `startPressed=true` → `startGame(1)` → `isPlaying=true`, `ballInLauncher=true`
2. `Ball` spawne à `[12.75, -2.3, 30.46]` (plunger)
3. Joueur maintient **Space** → charge le lanceur → relâche → impulsion `{x:0, y:0, z:-force}`
4. Bille remonte le plunger → touche le sensor gate → `setBallInLauncher(false)` (+500ms)
5. Gate `coll_maker_gate` apparaît (visible + collider) → bille ne peut plus revenir
6. **Q/D** → `left_flipper`/`right_flipper` → `Flipper` anime (lerp vers `Math.PI/3`)
7. Bille touche un bumper (`isBumper=true`) → `applyImpulse` de répulsion
8. Bille tombe → `loseBall()` (si `DeathZone` implémentée) ou sort du plateau

---

*Document généré le 2026-06-30*
