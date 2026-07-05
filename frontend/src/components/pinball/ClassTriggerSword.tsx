import {
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
  type IntersectionEnterPayload,
} from "@react-three/rapier";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { SWORD_POSITIONS } from "@/config/gameBalancingConfig";
import ParticleExplosion from "@/components/pinball/ParticleExplosion";

export default function ClassTriggerSword() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);

  const isSwordActive = useGameStore((state) => state.swordActive);
  const currentPositionIndex = useGameStore(
    (state) => state.swordPositionIndex,
  );
  const collectSword = useGameStore((state) => state.collectSword);

  const { nodes, materials } = useGLTF("/models/Pinball_BaseFinal.glb") as any;

  const glowingBlade = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: materials.Blade.color,
      map: materials.Blade.map,
      emissive: new THREE.Color("#00ffff"),
      emissiveIntensity: 4,
      roughness: 0.2,
      metalness: 0.8,
    });
  }, [materials.Blade]);

  const position = useMemo(() => {
    if (!isSwordActive) {
      return new THREE.Vector3(0, -8, 0);
    }
    const pos = SWORD_POSITIONS[currentPositionIndex] || SWORD_POSITIONS[0];
    return new THREE.Vector3(pos[0], pos[1] + 3.5, pos[2]);
  }, [isSwordActive, currentPositionIndex]);

  // Force la téléportation du rigidBody via la ref pour éviter les problèmes de synchronisation avec React Three Fiber
  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(
        { x: position.x, y: position.y, z: position.z },
        true,
      );
    }
  }, [position]);

  useEffect(() => {
    // Si l'épée vient de s'activer, on lance l'explosion de spawn
    if (isSwordActive) {
      setIsSpawning(true);

      const timer = setTimeout(() => {
        setIsSpawning(false);
      }, 800); // Durée de l'effet

      return () => clearTimeout(timer); // Sécurité (nettoyage)
    }
  }, [isSwordActive]);
  const handleIntersection = (e: IntersectionEnterPayload) => {
    const objectName = e.other.rigidBodyObject?.name;

    if (
      !isExploding &&
      isSwordActive &&
      objectName === "ball" &&
      position.y > -10
    ) {
      console.log("⚔️ Épée ramassée ! BOOM !");
      setIsExploding(true);

      setTimeout(() => {
        collectSword();
        setIsExploding(false);
      }, 800);
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      name="visual_sword"
      type="fixed"
      colliders={false}
      position={position}
      scale={2}
    >
      <group
        name="visual_sword"
        position={[0, isSwordActive && !isExploding ? -0.762 : -8, 0]}
      >
        <mesh
          name="defaultMaterial"
          geometry={nodes.defaultMaterial.geometry}
          material={glowingBlade}
          frustumCulled={false} // Force WebGL à compiler la lumière au chargement
        />
        <mesh
          name="defaultMaterial_1"
          geometry={nodes.defaultMaterial_1.geometry}
          material={materials.Hilt}
          frustumCulled={false}
        />
      </group>

      <ParticleExplosion
        count={150}
        color="#00ffff"
        isExploding={isExploding || isSpawning}
      />

      <CuboidCollider
        args={[0.4, 1.2, 0.4]}
        position={[0, -2, 0]}
        sensor
        onIntersectionEnter={handleIntersection}
      />
    </RigidBody>
  );
}

useGLTF.preload("/models/Pinball_BaseFinal.glb");
