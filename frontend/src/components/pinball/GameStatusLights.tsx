// import { useRef } from "react";
// import * as THREE from "three";
// import { useFrame } from "@react-three/fiber";
// import { useGameStore } from "@/store/gameStore/useGameStore";
//
// type GameStatusLightsProps = {
//   nodes: any;
//   materials: any;
// };
//
// export default function GameStatusLights({
//   nodes,
//   materials,
// }: GameStatusLightsProps) {
//   // 1. Récupération réactive de la classe (se met à jour via React car c'est un state statique)
//   const activeClass = useGameStore((state) => state.activeClass);
//
//   // 2. Références pour manipuler la visibilité des multiplicateurs hors du cycle React
//   const multi2Ref = useRef<THREE.Mesh>(null);
//   const multi4Ref = useRef<THREE.Mesh>(null);
//   const multi6Ref = useRef<THREE.Mesh>(null);
//   const multi8Ref = useRef<THREE.Mesh>(null);
//   const multi12Ref = useRef<THREE.Mesh>(null);
//   const multi50Ref = useRef<THREE.Mesh>(null);
//
//   // 3. Boucle d'animation (60fps) pour vérifier l'expiration des multiplicateurs en temps réel
//   useFrame(() => {
//     // Va chercher la valeur calculée (avec vérification de Date.now() > expiresAt)
//     const currentMult = useGameStore.getState().getCurrentMultiplier();
//
//     // Met à jour la visibilité directement dans le moteur 3D (Zéro re-render React = super fluide !)
//     if (multi2Ref.current) multi2Ref.current.visible = currentMult >= 2;
//     if (multi4Ref.current) multi4Ref.current.visible = currentMult >= 4;
//     if (multi6Ref.current) multi6Ref.current.visible = currentMult >= 6;
//     if (multi8Ref.current) multi8Ref.current.visible = currentMult >= 8;
//     if (multi12Ref.current) multi12Ref.current.visible = currentMult >= 12;
//     if (multi50Ref.current) multi50Ref.current.visible = currentMult >= 50;
//   });
//
//   return (
//     <group name="game_status_lights">
//       {/* ========================================== */}
//       {/* 🛡️ INDICATEURS DE CLASSES */}
//       {/* ========================================== */}
//
//       <mesh
//         name="visual_elf_on"
//         geometry={nodes.visual_elf_on.geometry}
//         material={materials.M_elf_on}
//         position={[-4.524, -2.849, 15.309]}
//         scale={5.467}
//         visible={activeClass === "Elf"}
//       />
//
//       <mesh
//         name="vsiual_necro_on"
//         geometry={nodes.vsiual_necro_on.geometry}
//         material={materials.M_necro_on}
//         position={[3.485, -2.849, 14.396]}
//         scale={3.012}
//         visible={activeClass === "Necromancer"}
//       />
//
//       <mesh
//         name="visual_dwarf_on"
//         geometry={nodes.visual_dwarf_on.geometry}
//         material={materials.M_dwarf_on}
//         position={[4.453, -2.849, 10.669]}
//         scale={3.662}
//         visible={activeClass === "Dwarf"}
//       />
//
//       <mesh
//         name="visual_warrior_on"
//         geometry={nodes.visual_warrior_on.geometry}
//         material={materials.M_warrior_on}
//         position={[-5.37, -2.849, 11.063]}
//         scale={4.289}
//         visible={activeClass === "Warrior"}
//       />
//
//       {/* ========================================== */}
//       {/* ✖️ INDICATEURS DE MULTIPLICATEURS */}
//       {/* ========================================== */}
//
//       <mesh
//         ref={multi2Ref}
//         name="visual_multi2_on"
//         geometry={nodes.visual_multi2_on.geometry}
//         material={materials.M_mutli2_on} // Faute de frappe export Blender ("mutli2") gardée
//         position={[-3.027, -2.826, 14.049]}
//         visible={false} // État initial géré par le useFrame
//       />
//
//       <mesh
//         ref={multi4Ref}
//         name="visual_multi4_on"
//         geometry={nodes.visual_multi4_on.geometry}
//         material={materials.M_multi4_on}
//         position={[1.715, -2.826, 14.049]}
//         visible={false}
//       />
//
//       <mesh
//         ref={multi6Ref}
//         name="visual_multi6_on"
//         geometry={nodes.visual_multi6_on.geometry}
//         material={materials.M_multi6_on}
//         position={[-3.027, -2.826, 18.307]}
//         visible={false}
//       />
//
//       <mesh
//         ref={multi8Ref}
//         name="visual_multi8_on"
//         geometry={nodes.visual_multi8_on.geometry}
//         material={materials.M_multi8_on}
//         position={[1.715, -2.826, 18.307]}
//         visible={false}
//       />
//
//       <mesh
//         ref={multi12Ref}
//         name="visual_multi12_on"
//         geometry={nodes.visual_multi12_on.geometry}
//         material={materials.M_multi12_on}
//         position={[-0.565, -2.826, 20.281]}
//         visible={false}
//       />
//
//       <mesh
//         ref={multi50Ref}
//         name="visual_multi50_on"
//         geometry={nodes.visual_multi50_on.geometry}
//         material={materials.M_multi50_on}
//         position={[-0.565, -2.826, 16.358]}
//         visible={false}
//       />
//     </group>
//   );
// }

// import { useRef } from "react";
// import * as THREE from "three";
// import { useFrame } from "@react-three/fiber";
// import { useGameStore } from "@/store/gameStore/useGameStore";
// import { useControls, folder } from "leva";
//
// type GameStatusLightsProps = {
//   nodes: any;
//   materials: any;
// };
//
// export default function GameStatusLights({
//   nodes,
//   materials,
// }: GameStatusLightsProps) {
//   // 💡 Lecture sélective du store pour les classes
//   const activeClass = useGameStore((state) => state.activeClass);
//
//   // =========================================================================
//   // 🛠️ OUTIL DE DIAGNOSTIC VISUEL (Leva)
//   // =========================================================================
//   const { forceLights, liftY } = useControls("Status Lights Debug", {
//     "Debug Rendu 3D": folder({
//       forceLights: { value: false, label: "Forcer l'allumage complet" },
//       liftY: {
//         value: 0.02,
//         min: 0,
//         max: 0.2,
//         step: 0.005,
//         label: "Surélévation (Anti Z-Fight)",
//       },
//     }),
//   });
//   // =========================================================================
//
//   const multi2Ref = useRef<THREE.Mesh>(null);
//   const multi4Ref = useRef<THREE.Mesh>(null);
//   const multi6Ref = useRef<THREE.Mesh>(null);
//   const multi8Ref = useRef<THREE.Mesh>(null);
//   const multi12Ref = useRef<THREE.Mesh>(null);
//   const multi50Ref = useRef<THREE.Mesh>(null);
//
//   // Boucle de rendu pour mettre à jour la visibilité des multiplicateurs à 60fps
//   useFrame(() => {
//     // Si le mode de test 3D est activé, on affiche tout sans condition
//     if (forceLights) {
//       if (multi2Ref.current) multi2Ref.current.visible = true;
//       if (multi4Ref.current) multi4Ref.current.visible = true;
//       if (multi6Ref.current) multi6Ref.current.visible = true;
//       if (multi8Ref.current) multi8Ref.current.visible = true;
//       if (multi12Ref.current) multi12Ref.current.visible = true;
//       if (multi50Ref.current) multi50Ref.current.visible = true;
//       return;
//     }
//
//     const currentMult = useGameStore.getState().getCurrentMultiplier();
//
//     if (multi2Ref.current) multi2Ref.current.visible = currentMult >= 2;
//     if (multi4Ref.current) multi4Ref.current.visible = currentMult >= 4;
//     if (multi6Ref.current) multi6Ref.current.visible = currentMult >= 6;
//     if (multi8Ref.current) multi8Ref.current.visible = currentMult >= 8;
//     if (multi12Ref.current) multi12Ref.current.visible = currentMult >= 12;
//     if (multi50Ref.current) multi50Ref.current.visible = currentMult >= 50;
//   });
//
//   return (
//     <group name="game_status_lights">
//       {/* ========================================== */}
//       {/* 🛡️ INDICATEURS DE CLASSES */}
//       {/* ========================================== */}
//
//       <mesh
//         name="visual_elf_on"
//         geometry={nodes.visual_elf_on.geometry}
//         material={materials.M_elf_on}
//         position={[-4.524, -2.849 + liftY, 15.309]} // 💡 Ajout du liftY pour passer au-dessus du sol baked
//         scale={5.467}
//         visible={forceLights || activeClass === "Elf"}
//       />
//
//       <mesh
//         name="vsiual_necro_on"
//         geometry={nodes.vsiual_necro_on.geometry}
//         material={materials.M_necro_on}
//         position={[3.485, -2.849 + liftY, 14.396]}
//         scale={3.012}
//         visible={forceLights || activeClass === "Necromancer"}
//       />
//
//       <mesh
//         name="visual_dwarf_on"
//         geometry={nodes.visual_dwarf_on.geometry}
//         material={materials.M_dwarf_on}
//         position={[4.453, -2.849 + liftY, 10.669]}
//         scale={3.662}
//         visible={forceLights || activeClass === "Dwarf"}
//       />
//
//       <mesh
//         name="visual_warrior_on"
//         geometry={nodes.visual_warrior_on.geometry}
//         material={materials.M_warrior_on}
//         position={[-5.37, -2.849 + liftY, 11.063]}
//         scale={4.289}
//         visible={forceLights || activeClass === "Warrior"}
//       />
//
//       {/* ========================================== */}
//       {/* ✖️ INDICATEURS DE MULTIPLICATEURS */}
//       {/* ========================================== */}
//
//       <mesh
//         ref={multi2Ref}
//         name="visual_multi2_on"
//         geometry={nodes.visual_multi2_on.geometry}
//         material={materials.M_mutli2_on}
//         position={[-3.027, -2.826 + liftY, 14.049]}
//       />
//
//       <mesh
//         ref={multi4Ref}
//         name="visual_multi4_on"
//         geometry={nodes.visual_multi4_on.geometry}
//         material={materials.M_multi4_on}
//         position={[1.715, -2.826 + liftY, 14.049]}
//       />
//
//       <mesh
//         ref={multi6Ref}
//         name="visual_multi6_on"
//         geometry={nodes.visual_multi6_on.geometry}
//         material={materials.M_multi6_on}
//         position={[-3.027, -2.826 + liftY, 18.307]}
//       />
//
//       <mesh
//         ref={multi8Ref}
//         name="visual_multi8_on"
//         geometry={nodes.visual_multi8_on.geometry}
//         material={materials.M_multi8_on}
//         position={[1.715, -2.826 + liftY, 18.307]}
//       />
//
//       <mesh
//         ref={multi12Ref}
//         name="visual_multi12_on"
//         geometry={nodes.visual_multi12_on.geometry}
//         material={materials.M_multi12_on}
//         position={[-0.565, -2.826 + liftY, 20.281]}
//       />
//
//       <mesh
//         ref={multi50Ref}
//         name="visual_multi50_on"
//         geometry={nodes.visual_multi50_on.geometry}
//         material={materials.M_multi50_on}
//         position={[-0.565, -2.826 + liftY, 16.358]}
//       />
//     </group>
//   );
// }
//
//
//
//
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, button } from "leva";

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

  // =========================================================================
  // 🛠️ OUTIL DE DEBUG (Leva)
  // =========================================================================
  useControls("Status Lights Debug", {
    "Test Multi Fakir (x4)": button(() => {
      useGameStore.getState().activateMultiplier("fakir", 4, 10000);
    }),
    "Test Multi Gems (x12)": button(() => {
      useGameStore.getState().activateMultiplier("gems", 12, 10000);
    }),
  });
  // =========================================================================

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

    // 💡 NOUVEAU : Fonction qui vérifie si une valeur spécifique (ex: 4) est active
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

  return (
    <group name="game_status_lights">
      {/* ========================================== */}
      {/* 🛡️ INDICATEURS DE CLASSES */}
      {/* ========================================== */}

      <mesh
        name="visual_elf_on"
        geometry={nodes.visual_elf_on.geometry}
        material={materials.M_elf_on}
        position={[-4.524, -2.849, 15.309]}
        scale={5.467}
        visible={activeClass === "Elf"}
      />

      <mesh
        name="vsiual_necro_on"
        geometry={nodes.vsiual_necro_on.geometry}
        material={materials.M_necro_on}
        position={[3.485, -2.849, 14.396]}
        scale={3.012}
        visible={activeClass === "Necromancer"}
      />

      <mesh
        name="visual_dwarf_on"
        geometry={nodes.visual_dwarf_on.geometry}
        material={materials.M_dwarf_on}
        position={[4.453, -2.849, 10.669]}
        scale={3.662}
        visible={activeClass === "Dwarf"}
      />

      <mesh
        name="visual_warrior_on"
        geometry={nodes.visual_warrior_on.geometry}
        material={materials.M_warrior_on}
        position={[-5.37, -2.849, 11.063]}
        scale={4.289}
        visible={activeClass === "Warrior"}
      />

      {/* ========================================== */}
      {/* ✖️ INDICATEURS DE MULTIPLICATEURS */}
      {/* ========================================== */}

      <mesh
        ref={multi2Ref}
        name="visual_multi2_on"
        geometry={nodes.visual_multi2_on.geometry}
        material={materials.M_mutli2_on}
        position={[-3.027, -2.826, 14.049]}
      />

      <mesh
        ref={multi4Ref}
        name="visual_multi4_on"
        geometry={nodes.visual_multi4_on.geometry}
        material={materials.M_multi4_on}
        position={[1.715, -2.826, 14.049]}
      />

      <mesh
        ref={multi6Ref}
        name="visual_multi6_on"
        geometry={nodes.visual_multi6_on.geometry}
        material={materials.M_multi6_on}
        position={[-3.027, -2.826, 18.307]}
      />

      <mesh
        ref={multi8Ref}
        name="visual_multi8_on"
        geometry={nodes.visual_multi8_on.geometry}
        material={materials.M_multi8_on}
        position={[1.715, -2.826, 18.307]}
      />

      <mesh
        ref={multi12Ref}
        name="visual_multi12_on"
        geometry={nodes.visual_multi12_on.geometry}
        material={materials.M_multi12_on}
        position={[-0.565, -2.826, 20.281]}
      />

      <mesh
        ref={multi50Ref}
        name="visual_multi50_on"
        geometry={nodes.visual_multi50_on.geometry}
        material={materials.M_multi50_on}
        position={[-0.565, -2.826, 16.358]}
      />
    </group>
  );
}
