import { useState } from "react";
import { RigidBody, CuboidCollider, IntersectionEnterPayload } from "@react-three/rapier";
import { useControls, folder } from "leva";
import ObjectSound from "./ObjectSound";

type HoleSensorProps = {
  id: string;
  soundUrl: string;
  defaultPos?: [number, number, number];
  defaultRot?: [number, number, number];
  defaultSize?: [number, number];
};

export default function HoleSensor({
  id,
  soundUrl,
  defaultPos = [0, -3, 0],
  defaultRot = [0, 0, 0],
  defaultSize = [1, 1],
}: HoleSensorProps) {
  const [playCount, setPlayCount] = useState(0);
  const [pitch, setPitch] = useState(1);

  // Pour afficher la zone d'intersection si on veut voir où elle est
  const { rapierDebug } = useControls("rapier", { rapierDebug: true });

  const controls = useControls(`HoleSensor ${id}`, {
    Transform: folder({
      pos: { value: defaultPos, step: 0.1 },
      rot: { value: defaultRot, step: 0.05 },
      size: { value: defaultSize, step: 0.1 },
    }),
  });

  const handleEnter = (e: IntersectionEnterPayload) => {
    // Si c'est la bille qui entre en collision
    if (
      e.colliderObject?.name === "ball" ||
      e.other.rigidBodyObject?.name === "ball" ||
      !e.other.rigidBodyObject?.name
    ) {
      // Variation de pitch faible : entre 0.95 et 1.05
      const randomPitch = 0.95 + Math.random() * 0.1;
      setPitch(randomPitch);
      
      // On incrémente le compteur pour déclencher l'effet (useEffect) dans ObjectSound
      setPlayCount((prev) => prev + 1);
    }
  };

  return (
    <group position={controls.pos as [number, number, number]} rotation={controls.rot as [number, number, number]}>
      {/* Sensor physique invisible */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleEnter}>
        <CuboidCollider args={[controls.size[0] / 2, 0.05, controls.size[1] / 2]} />
      </RigidBody>
      
      {/* Affichage optionnel pour le debug Leva */}
      {rapierDebug && (
        <mesh>
          <boxGeometry args={[controls.size[0], 0.1, controls.size[1]]} />
          <meshBasicMaterial color="purple" wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {/* Le son "one-shot" avec le pitch aléatoire */}
      <ObjectSound
        url={soundUrl}
        playTrigger={playCount}
        playbackRate={pitch}
        volume={2}
      />
    </group>
  );
}
