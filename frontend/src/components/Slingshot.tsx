import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useControls } from "leva";
import { useGameStore } from "@/store/useGameStore";
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
  const addScore = useGameStore((state) => state.addScore);
  const { restitution, force } = useControls("Slingshot Controls", {
    restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
    force: { value: 12, min: 0, max: 30, step: 0.1 },
  });
  const handleCollision = (e: any) => {
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
    </RigidBody>
  );
}
