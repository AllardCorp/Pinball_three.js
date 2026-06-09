import {
  RigidBody,
  type RapierRigidBody,
  type CollisionEnterPayload,
} from "@react-three/rapier";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import ObjectSound from "./ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";


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

// OPTIMISATION : Déclaration des vecteurs une seule fois en dehors du composant
// Ils seront réutilisés à chaque collision, zéro allocation mémoire (zéro Garbage Collection)
const targetScale = new THREE.Vector3(1, 1, 1);
const hitDirection = new THREE.Vector3();

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
  const [hitCount, setHitCount] = useState(0);

  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const visualMeshRef = useRef<THREE.Mesh>(null);

  const lastHitTime = useRef<number>(0);

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
      const now = performance.now();

      if (now - lastHitTime.current < 250) {
        return; // Évite les multi-hits
      }

      lastHitTime.current = now;
      if (!rigidBodyRef.current || !e.other.rigidBody) return;

      const ballPos = e.other.rigidBody.translation();
      const bumperPos = rigidBodyRef.current.translation();

      // OPTIMISATION : On utilise .set() sur notre vecteur global existant
      // au lieu de créer un 'new THREE.Vector3()'
      hitDirection
        .set(ballPos.x - bumperPos.x, 0, ballPos.z - bumperPos.z)
        .normalize();

      // On multiplie directement ce vecteur existant
      hitDirection.multiplyScalar(strength);
      e.other.rigidBody.applyImpulse(hitDirection, true);

      // Animation visuelle du tonneau
      if (visualMeshRef.current) {
        visualMeshRef.current.scale.set(1.4, 1.4, 1.4);
      }

      // LOGIQUE DU JEU
      addScore(500);
      toggleRuby(id);
      setHitCount((prev) => prev + 1);
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
        // OPTIMISATION : LE FIX DU CPU SPIKE
        // On ne gère plus la propriété 'visible'. Le mesh est toujours visible,
        // ce qui force Three.js à compiler le shader dès l'écran de chargement.
        // À la place, on le rétrécit à une taille de 0 (invisible à l'œil nu) ou on le met à taille 1.
        scale={isRubyActive ? 1 : 0}
        geometry={rubyGeometry}
        material={rubyMaterial}
        position={[0, 2.012, 0]}
      />

      <ObjectSound
        {...SOUNDS_CONFIG.bumper.hit}
        playTrigger={hitCount}
      />
    </RigidBody>
  );
}
