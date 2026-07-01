import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, folder, button } from "leva";

// Valeurs par défaut initiales
const DEFAULT_POSITION: [number, number, number] = [-1.1, -2.2, 28.7];
const DEFAULT_SIZE: [number, number, number] = [1.1, 0.6, 1.1]; // Half-extents (demi-taille)

export default function UndeathSaver() {
  const isUndeathActive = useGameStore((state) => state.isUndeathActive);

  // OUTIL DE LEVEL DESIGN (Leva)
  // Pas de la config leva global car utile pour le debug et pas pour le gameplay
  const { debugMode, sx, sy, sz, rx, ry, rz, width, height, depth } =
    useControls("Undeath Saver", {
      LevelDesign: folder(
        {
          debugMode: {
            value: false,
            label: "Forcer l'apparition",
          },
          position: folder({
            sx: { value: DEFAULT_POSITION[0], step: 0.1, label: "Pos X" },
            sy: { value: DEFAULT_POSITION[1], step: 0.1, label: "Pos Y" },
            sz: { value: DEFAULT_POSITION[2], step: 0.1, label: "Pos Z" },
          }),
          rotation: folder({
            rx: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot X",
            },
            ry: {
              value: 0.8,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Y",
            },
            rz: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Z",
            },
          }),
          taille: folder({
            width: {
              value: DEFAULT_SIZE[0],
              min: 0.1,
              step: 0.05,
              label: "Largeur (X)",
            },
            height: {
              value: DEFAULT_SIZE[1],
              min: 0.1,
              step: 0.05,
              label: "Hauteur (Y)",
            },
            depth: {
              value: DEFAULT_SIZE[2],
              min: 0.1,
              step: 0.05,
              label: "Épaisseur (Z)",
            },
          }),
          "Log Config": button((get) => {
            console.log(`\n--- Config du Sauveur de Bille ---`);
            console.log(
              `const DEFAULT_POSITION: [number, number, number] = [${get("sx").toFixed(2)}, ${get("sy").toFixed(2)}, ${get("sz").toFixed(2)}];`,
            );
            console.log(
              `// Rotation : [${get("rx").toFixed(2)}, ${get("ry").toFixed(2)}, ${get("rz").toFixed(2)}]`,
            );
            console.log(
              `const DEFAULT_SIZE: [number, number, number] = [${get("width").toFixed(2)}, ${get("height").toFixed(2)}, ${get("depth").toFixed(2)}];`,
            );
          }),
        },
        { collapsed: true },
      ),
    });

  // Détermination des vecteurs finaux
  const currentPosition = useMemo<[number, number, number]>(
    () => [sx, sy, sz],
    [sx, sy, sz],
  );
  const currentRotation = useMemo<[number, number, number]>(
    () => [rx, ry, rz],
    [rx, ry, rz],
  );
  const currentSize = useMemo<[number, number, number]>(
    () => [width, height, depth],
    [width, height, depth],
  );

  const isVisible = isUndeathActive || debugMode;

  if (!isVisible) return null;

  // Ajoute la taille dans la clé pour que Rapier reconstruise le collider au redimensionnement
  const rigidKey = debugMode
    ? `undeath_saver_${sx}_${sy}_${sz}_${ry}_${width}_${height}_${depth}`
    : "undeath_saver_active";

  return (
    <RigidBody
      key={rigidKey}
      type="fixed"
      position={currentPosition}
      rotation={currentRotation}
      colliders={false}
    >
      {/* Visuel du bloqueur (on multiplie la taille par 2) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry
          args={[currentSize[0] * 2, currentSize[1] * 2, currentSize[2] * 2]}
        />
        <meshStandardMaterial
          color={debugMode && !isUndeathActive ? "#ff00ff" : "#00ffff"}
          emissive={isUndeathActive ? "#00ffff" : "#000000"}
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Collider solide (half-extents) */}
      <CuboidCollider args={currentSize} restitution={0.6} />
    </RigidBody>
  );
}
