import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { type PlayfieldZone } from "@/config/gameBalancingConfig";

type ScoreTargetProps = {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  points?: number;
  zone?: PlayfieldZone;
};
// Fakir Targets
export default function ScoreTarget({
  geometry,
  position,
  points = 50,
  zone = "Neutral",
}: ScoreTargetProps) {
  const addZoneScore = useGameStore((state) => state.addZoneScore);
  const lastHitTime = useRef<number>(0);

  const handleCollision = (e: CollisionEnterPayload) => {
    if (e.other.rigidBodyObject?.name === "ball") {
      const now = performance.now();
      // Empêche les multi-touches instantanées
      if (now - lastHitTime.current < 250) return;

      lastHitTime.current = now;
      addZoneScore(points, zone);

      console.log(`+${points} points !`);
    }
  };

  return (
    <RigidBody
      type="fixed"
      colliders="hull"
      position={position}
      restitution={0.6}
      onCollisionEnter={handleCollision}
      includeInvisible
    >
      <mesh visible={false} geometry={geometry} />
    </RigidBody>
  );
}
