import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useControls } from "leva";

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
  const { restitution, force } = useControls("Slingshot Controls", {
    // Tu peux ajuster les valeurs 'min', 'max' et 'step' selon la taille de ton flipper !
    restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
    force: { value: 12, min: 0, max: 30, step: 0.1 },
  });
  const handleCollision = (e: any) => {
    // e.other.rigidBody représente l'objet qui a percuté le slingshot (ta bille)
    if (e.other.rigidBody) {
      // 💥 La puissance du coup (à ajuster selon le poids de ta bille)
      const forceMultiplier = force;

      // On convertit ta direction en Vecteur mathématique et on y applique la force
      const impulse = new THREE.Vector3(...pushDirection)
        .normalize() // S'assure que la direction est pure
        .multiplyScalar(forceMultiplier);

      // On frappe la bille ! (le "true" sert à réveiller la bille si elle dormait)
      e.other.rigidBody.applyImpulse(impulse, true);
    }
  };

  return (
    <RigidBody
      type="fixed"
      colliders="hull"
      restitution={restitution} // Un tout petit rebond naturel de base
      position={position} // 👈 Comme pour les flippers, on déplace le RigidBody
      rotation={rotation}
      onCollisionEnter={handleCollision}
    >
      <mesh geometry={geometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </RigidBody>
  );
}
