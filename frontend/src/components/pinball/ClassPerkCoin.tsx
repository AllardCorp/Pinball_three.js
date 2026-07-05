import { useGameStore } from "@/store/gameStore/useGameStore";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function ClassPerkCoin({
  nodes,
  materials,
}: {
  nodes: any;
  materials: any;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Lecture du store
  const isPowerOnCooldown = useGameStore((state) => state.isPowerOnCooldown);
  const activeClass = useGameStore((state) => state.activeClass);

  useFrame(() => {
    if (!meshRef.current) return;

    // Définition de la cible (Math.PI ou 0)
    const target = activeClass !== "None" && !isPowerOnCooldown ? Math.PI : 0;

    // Récupère la rotation actuelle
    const currentRot = meshRef.current.rotation.x;

    // OPTIMISATION : Si on est déjà à destination (ou presque), on ne fait RIEN.
    // Cela évite de recalculer la matrice du mesh à l'infini pour des micro-variations.
    const distance = Math.abs(currentRot - target);

    if (distance > 0.001) {
      // Si on est encore loin, on Lerp
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        currentRot,
        target,
        0.05,
      );
    } else if (currentRot !== target) {
      // Si on est très proche, on "snappe" exactement sur la cible pour figer l'objet
      meshRef.current.rotation.x = target;
    }
    // Si distance <= 0.001 ET currentRot === target, le bloc if/else est ignoré,
    // le mesh reste inactif
  });

  return (
    <mesh
      ref={meshRef}
      geometry={nodes.visual_super_rubber_class_coin.geometry}
      material={materials.M_coin_comp_default}
      position={[5.517, -1.362, 19.445]}
    />
  );
}
