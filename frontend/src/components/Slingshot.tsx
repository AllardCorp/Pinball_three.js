import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

export default function Slingshot({
  geometry,
  position,
  rotation,
  pushDirection,
}) {
  const handleCollision = (e) => {
    // e.other.rigidBody représente l'objet qui a percuté le slingshot (ta bille)
    if (e.other.rigidBody) {
      // 💥 La puissance du coup (à ajuster selon le poids de ta bille)
      const forceMultiplier = 6;

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
      restitution={0.2} // Un tout petit rebond naturel de base
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
