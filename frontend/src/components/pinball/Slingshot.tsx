import { useState } from "react";
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import ObjectSound from "@/components/sounds/ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";
import { useGameDebug } from "@/config/useGameDebug";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

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
  const { slingshotsRestitution, force } = useGameDebug();

  const handleCollision = (e: CollisionEnterPayload) => {
    // e.other.rigidBody = la bille qui a touché le slingshot
    if (e.other.rigidBody) {
      // Puissance du coup
      const forceMultiplier = force;

      // Convertion de la direction en Vecteur mathématique et on applique la force
      const impulse = new THREE.Vector3(...pushDirection)
        .normalize() // S'assure que la direction est pure
        .multiplyScalar(forceMultiplier);

      addScore(SCORE_VALUES.slingshot);
      // Frappe la bille ! ("true" sert à réveiller la bille si elle dormait)
      e.other.rigidBody.applyImpulse(impulse, true);
      setHitCount((prev) => prev + 1);
    }
  };

  return (
    <RigidBody
      type="fixed"
      colliders="hull"
      restitution={slingshotsRestitution}
      position={position}
      rotation={rotation}
      onCollisionEnter={handleCollision}
    >
      <mesh geometry={geometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <ObjectSound {...SOUNDS_CONFIG.slingshot.hit} playTrigger={hitCount} />
    </RigidBody>
  );
}
