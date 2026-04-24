import {
  RigidBody,
  type RapierRigidBody,
  type CollisionEnterPayload,
} from "@react-three/rapier";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type BumperProps = {
  colliderGeometry: THREE.BufferGeometry; // La géométrie pour la physique
  visualGeometry: THREE.BufferGeometry; // La géométrie pour le visuel
  visualMaterial: THREE.Material; // Le matériau du bumper
  position: [number, number, number];
  strength?: number;
};

const targetScale = new THREE.Vector3(1, 1, 1);

export default function Bumper({
  colliderGeometry,
  visualGeometry,
  visualMaterial,
  position,
  strength = 15,
}: BumperProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const visualMeshRef = useRef<THREE.Mesh>(null); // Ref sur le mesh VISUEL

  // Animation de retour à la taille normale
  useFrame((_, delta) => {
    if (visualMeshRef.current) {
      visualMeshRef.current.scale.lerp(targetScale, delta * 12);
    }
  });

  const handleCollision = (e: CollisionEnterPayload) => {
    if (e.other.rigidBody) {
      if (!rigidBodyRef.current) return;

      const ballPos = e.other.rigidBody.translation();
      const bumperPos = rigidBodyRef.current.translation();

      const direction = new THREE.Vector3(
        ballPos.x - bumperPos.x,
        0,
        ballPos.z - bumperPos.z,
      ).normalize();

      const impulse = direction.multiplyScalar(strength);
      e.other.rigidBody.applyImpulse(impulse, true);

      // 💥 On fait grossir uniquement le mesh VISUEL
      if (visualMeshRef.current) {
        visualMeshRef.current.scale.set(1.4, 1.4, 1.4);
      }
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="fixed"
      colliders="hull"
      position={position}
      onCollisionEnter={handleCollision}
      includeInvisible // Pour que le mesh invisible génère quand même le collider
    >
      {/* 1. MESH DE COLLISION (Invisible et fixe) */}
      <mesh geometry={colliderGeometry} visible={false}>
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* 2. MESH VISUEL (Visible et animé) */}
      <mesh
        ref={visualMeshRef}
        geometry={visualGeometry}
        material={visualMaterial}
      />
    </RigidBody>
  );
}
