import { useState } from "react";
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier";
import * as THREE from "three";
import { useControls } from "leva";
import { useGameStore } from "@/store/useGameStore";
import ObjectSound from "./ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";

type SlingshotProps = {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  pushDirection: [number, number, number];
};
export default function Slingshot({
  geometry,
  position,
  rotation,
  pushDirection,
}: SlingshotProps) {
  const [hitCount, setHitCount] = useState(0);
  const addScore = useGameStore((state) => state.addScore);
  const { restitution, force } = useControls("Slingshot Controls", {
    restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
    force: { value: 12, min: 0, max: 30, step: 0.1 },
  });
  const handleCollision = (e: CollisionEnterPayload) => {
    // e.other.rigidBody = la bille qui a touché le slingshot
    if (e.other.rigidBody) {
      // La puissance du coup
      const forceMultiplier = force;

      // Convertion de la direction en Vecteur mathématique et on applique la force
      const impulse = new THREE.Vector3(...pushDirection)
        .normalize() // S'assure que la direction est pure
        .multiplyScalar(forceMultiplier);

      addScore(100);
      // Frappe la bille ! ("true" sert à réveiller la bille si elle dormait)
      e.other.rigidBody.applyImpulse(impulse, true);
      setHitCount((prev) => prev + 1);
    }
  };

  return (
    <RigidBody
      type="fixed"
      colliders="hull"
      restitution={restitution}
      position={position}
      rotation={rotation}
      onCollisionEnter={handleCollision}
    >
      <mesh geometry={geometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <ObjectSound
        {...SOUNDS_CONFIG.slingshot.hit}
        playTrigger={hitCount}
      />
    </RigidBody>
  );
}
