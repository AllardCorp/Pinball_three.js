import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore/useGameStore";

type GameStatusLightsProps = {
  nodes: any;
  materials: any;
};

export default function GameStatusLights({
  nodes,
  materials,
}: GameStatusLightsProps) {
  // 1. Récupération réactive de la classe
  const activeClass = useGameStore((state) => state.activeClass);

  // 2. Références pour manipuler la visibilité
  const multi2Ref = useRef<THREE.Mesh>(null);
  const multi4Ref = useRef<THREE.Mesh>(null);
  const multi6Ref = useRef<THREE.Mesh>(null);
  const multi8Ref = useRef<THREE.Mesh>(null);
  const multi12Ref = useRef<THREE.Mesh>(null);
  const multi50Ref = useRef<THREE.Mesh>(null);

  // 3. Boucle d'animation (60fps)
  useFrame(() => {
    // On récupère tout le dictionnaire des multiplicateurs actifs
    const activeMultipliers = useGameStore.getState().activeMultipliers;
    const now = Date.now();

    // Fonction qui vérifie si une valeur spécifique (ex: 4) est active
    const isValueActive = (targetValue: number) => {
      return Object.values(activeMultipliers).some(
        (mult) => mult.value === targetValue && mult.expiresAt > now,
      );
    };

    // On allume uniquement les valeurs qui sont en cours dans le store
    if (multi2Ref.current) multi2Ref.current.visible = isValueActive(2);
    if (multi4Ref.current) multi4Ref.current.visible = isValueActive(4);
    if (multi6Ref.current) multi6Ref.current.visible = isValueActive(6);
    if (multi8Ref.current) multi8Ref.current.visible = isValueActive(8);
    if (multi12Ref.current) multi12Ref.current.visible = isValueActive(12);
    if (multi50Ref.current) multi50Ref.current.visible = isValueActive(50);
  });

  // Léger offset Y pour éviter que la lumière ne clignote sous le plateau
  const liftY = 0.005;

  return (
    <group name="game_status_lights">
      {/* INDICATEURS DE CLASSES */}

      <mesh
        name="visual_elf_on"
        geometry={nodes.visual_elf_on.geometry}
        material={materials.M_elf_on}
        position={[-4.524, -2.849 + liftY, 15.309]}
        scale={5.467}
        visible={activeClass === "Elf"}
        renderOrder={1}
      />

      <mesh
        name="vsiual_necro_on"
        geometry={nodes.vsiual_necro_on.geometry}
        material={materials.M_necro_on}
        position={[3.485, -2.849 + liftY, 14.396]}
        scale={3.012}
        visible={activeClass === "Necromancer"}
        renderOrder={1}
      />

      <mesh
        name="visual_dwarf_on"
        geometry={nodes.visual_dwarf_on.geometry}
        material={materials.M_dwarf_on}
        position={[4.453, -2.849 + liftY, 10.669]}
        scale={3.662}
        visible={activeClass === "Dwarf"}
        renderOrder={1}
      />

      <mesh
        name="visual_warrior_on"
        geometry={nodes.visual_warrior_on.geometry}
        material={materials.M_warrior_on}
        position={[-5.37, -2.849 + liftY, 11.063]}
        scale={4.289}
        visible={activeClass === "Warrior"}
        renderOrder={1}
      />

      {/* INDICATEURS DE MULTIPLICATEURS */}
      <mesh
        ref={multi2Ref}
        name="visual_multi2_on"
        geometry={nodes.visual_multi2_on.geometry}
        material={materials.M_mutli2_on}
        position={[-3.027, -2.816 + liftY, 14.049]}
        renderOrder={2}
      />

      <mesh
        ref={multi4Ref}
        name="visual_multi4_on"
        geometry={nodes.visual_multi4_on.geometry}
        material={materials.M_multi4_on}
        position={[1.715, -2.816 + liftY, 14.049]}
        renderOrder={2}
      />

      <mesh
        ref={multi6Ref}
        name="visual_multi6_on"
        geometry={nodes.visual_multi6_on.geometry}
        material={materials.M_multi6_on}
        position={[-3.027, -2.816 + liftY, 18.307]}
        renderOrder={2}
      />

      <mesh
        ref={multi8Ref}
        name="visual_multi8_on"
        geometry={nodes.visual_multi8_on.geometry}
        material={materials.M_multi8_on}
        position={[1.715, -2.816 + liftY, 18.307]}
        renderOrder={2}
      />

      <mesh
        ref={multi12Ref}
        name="visual_multi12_on"
        geometry={nodes.visual_multi12_on.geometry}
        material={materials.M_multi12_on}
        position={[-0.565, -2.816 + liftY, 20.281]}
        renderOrder={2}
      />

      <mesh
        ref={multi50Ref}
        name="visual_multi50_on"
        geometry={nodes.visual_multi50_on.geometry}
        material={materials.M_multi50_on}
        position={[-0.565, -2.816 + liftY, 16.358]}
        renderOrder={2}
      />
    </group>
  );
}
