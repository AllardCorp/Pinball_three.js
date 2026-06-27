import {
  RigidBody,
  type RapierRigidBody,
  type CollisionEnterPayload,
} from "@react-three/rapier";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import ObjectSound from "./ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";

type BumperProps = {
  id: 0 | 1 | 2;
  colliderGeometry: THREE.BufferGeometry;
  // Nouveau modèle : le parent peut fournir directement un node prêt à rendre.
  visualNode?: React.ReactNode;
  // Ancien modèle : certains fichiers MVP passent encore une géométrie et un
  // matériau séparés. Cette compatibilité permet de garder le build stable le
  // temps que les modèles soient harmonisés.
  visualGeometry?: THREE.BufferGeometry;
  visualMaterial?: THREE.Material;
  rubyGeometry: THREE.BufferGeometry;
  rubyMaterial: THREE.Material;
  position: [number, number, number];
  strength?: number;
};

const targetScale = new THREE.Vector3(1, 1, 1);
const hitDirection = new THREE.Vector3();

export default function Bumper({
  id,
  colliderGeometry,
  visualNode,
  visualGeometry,
  visualMaterial,
  rubyGeometry,
  rubyMaterial,
  position,
  strength = 15,
}: BumperProps) {
  const [hitCount, setHitCount] = useState(0);

  const rigidBodyRef = useRef<RapierRigidBody>(null);
  // Utilisation d'un Group à la place d'un Mesh
  const visualGroupRef = useRef<THREE.Group>(null);
  const lastHitTime = useRef<number>(0);

  const addScore = useGameStore((state) => state.addScore);
  const toggleRuby = useGameStore((state) => state.toggleRuby);
  const isRubyActive = useGameStore((state) => state.rubiesActive[id]);

  useFrame((_, delta) => {
    // Animation du group
    if (visualGroupRef.current) {
      visualGroupRef.current.scale.lerp(targetScale, delta * 12);
    }
  });

  const handleCollision = (e: CollisionEnterPayload) => {
    if (e.other.rigidBodyObject?.name === "ball") {
      const now = performance.now();

      if (now - lastHitTime.current < 250) {
        return;
      }

      lastHitTime.current = now;
      if (!rigidBodyRef.current || !e.other.rigidBody) return;

      const ballPos = e.other.rigidBody.translation();
      const bumperPos = rigidBodyRef.current.translation();

      hitDirection
        .set(ballPos.x - bumperPos.x, 0, ballPos.z - bumperPos.z)
        .normalize();

      hitDirection.multiplyScalar(strength);
      e.other.rigidBody.applyImpulse(hitDirection, true);

      // Grossit le groupe entier
      if (visualGroupRef.current) {
        visualGroupRef.current.scale.set(1.4, 1.4, 1.4);
      }

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

      {/* Enveloppe le visuel fourni dans un groupe pour l'animer. */}
      <group ref={visualGroupRef}>
        {visualNode ??
          (visualGeometry && visualMaterial ? (
            <mesh geometry={visualGeometry} material={visualMaterial} />
          ) : null)}
      </group>

      <mesh
        scale={isRubyActive ? 1 : 0}
        geometry={rubyGeometry}
        material={rubyMaterial}
        position={[0, 2.012, 0]}
      />

      <ObjectSound {...SOUNDS_CONFIG.bumper.hit} playTrigger={hitCount} />
    </RigidBody>
  );
}
