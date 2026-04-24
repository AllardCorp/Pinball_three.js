import {
  RigidBody,
  type RapierRigidBody,
  type CollisionEnterPayload,
} from "@react-three/rapier";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

type BumperProps = {
  id: 0 | 1 | 2;
  colliderGeometry: THREE.BufferGeometry;
  visualGeometry: THREE.BufferGeometry;
  visualMaterial: THREE.Material;
  rubyGeometry: THREE.BufferGeometry;
  rubyMaterial: THREE.Material;
  position: [number, number, number];
  strength?: number;
};

const targetScale = new THREE.Vector3(1, 1, 1);

export default function Bumper({
  id,
  colliderGeometry,
  visualGeometry,
  visualMaterial,
  rubyGeometry,
  rubyMaterial,
  position,
  strength = 15,
}: BumperProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const visualMeshRef = useRef<THREE.Mesh>(null);

  // 🛡️ 1. LE CHRONOMÈTRE DE SÉCURITÉ
  const lastHitTime = useRef<number>(0);

  // --- ZUSTAND : Connexion au Cerveau ---
  const addScore = useGameStore((state) => state.addScore);
  const toggleRuby = useGameStore((state) => state.toggleRuby);
  const isRubyActive = useGameStore((state) => state.rubiesActive[id]);

  // Animation de retour à la taille normale
  useFrame((_, delta) => {
    if (visualMeshRef.current) {
      visualMeshRef.current.scale.lerp(targetScale, delta * 12);
    }
  });

  const handleCollision = (e: CollisionEnterPayload) => {
    if (e.other.rigidBodyObject?.name === "ball") {
      // ⏱️ 2. VÉRIFICATION DU TEMPS
      const now = performance.now();
      // Si la dernière collision a eu lieu il y a moins de 250 millisecondes...
      if (now - lastHitTime.current < 250) {
        // ... on annule tout ! On l'ignore.
        return;
      }

      // Si on est ici, c'est un vrai "nouveau" coup. On met le chrono à jour.
      lastHitTime.current = now;
      if (!rigidBodyRef.current || !e.other.rigidBody) return;
      console.log("VRAIE collision pour l'ID :", id);

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

      // 💥 Animation visuelle du tonneau
      if (visualMeshRef.current) {
        visualMeshRef.current.scale.set(1.4, 1.4, 1.4);
      }

      // 🎮 LOGIQUE DU JEU
      addScore(100);
      toggleRuby(id);
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="fixed"
      colliders="hull"
      position={position}
      onCollisionEnter={handleCollision}
      includeInvisible
    >
      <mesh geometry={colliderGeometry} visible={false}>
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh
        ref={visualMeshRef}
        geometry={visualGeometry}
        material={visualMaterial}
      />

      <mesh
        visible={isRubyActive}
        geometry={rubyGeometry}
        material={rubyMaterial}
        position={[0, 2.012, 0]}
      />
    </RigidBody>
  );
}
