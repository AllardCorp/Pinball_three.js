import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useControls } from "leva";
// import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore"; // Ajuste le chemin
type LuncherGateProps = {
  nodes: any;
  materials: any;
};
export default function LauncherGate({ nodes, materials }: LuncherGateProps) {
  const ballInLauncher = useGameStore((state) => state.ballInLauncher);
  const setBallInLauncher = useGameStore((state) => state.setBallInLauncher);
  const { gateStartX, gateStartY, gateStartZ } = useControls(
    "Gate sensors Position",
    {
      gateStartX: { value: 8.5, min: -20, max: 20, step: 0.1 },
      gateStartY: { value: -1.6, min: -20, max: 20, step: 0.1 },
      gateStartZ: { value: 5.9, min: -20, max: 80, step: 0.1 },
    },
  );
  return (
    <group>
      {/* 1. LE SENSOR INVISIBLE (La ligne d'arrivée du lanceur) */}
      <RigidBody
        type="fixed"
        sensor
        onIntersectionEnter={(e) => {
          console.log(
            "Intersection ! Nom de l'objet :",
            e.other.rigidBodyObject?.name,
          );
          if (e.other.rigidBodyObject?.name === "ball") {
            console.log("Bille confirmé !");
            setTimeout(() => {
              setBallInLauncher(false);
            }, 500); // Petit délai pour être sûr que la bille soit bien passée
          }
        }}
        // 👇 ATTENTION : Il faudra ajuster cette position pour qu'elle soit
        // placée juste *APRÈS* la gate, pour que la bille ait le temps de passer.
        position={[gateStartX, gateStartY, gateStartZ]}
        rotation={[0, Math.PI / 2.6, 0]}
      >
        {/* Un rectangle assez large pour être sûr que la bille le touche */}
        <CuboidCollider args={[1, 1, 0.2]} />
      </RigidBody>

      {/* 2. LE VISUEL DE LA GATE (Toujours visible) */}
      <mesh
        geometry={nodes.visual_obj_gate_5.geometry}
        material={materials.PaletteMaterial001}
        position={[8.733, -1.018, 5.992]}
      />

      {/* 3. LE COLLIDER PHYSIQUE (N'existe que si la bille a passé le sensor) */}
      {!ballInLauncher && (
        <RigidBody
          includeInvisible
          type="fixed"
          colliders="hull"
          restitution={0}
        >
          <mesh
            visible={false}
            geometry={nodes.coll_gate.geometry}
            position={[8.733, -1.272, 5.992]}
          />
        </RigidBody>
      )}
    </group>
  );
}
// AVEC L'animation de la gate (WORK IN PROGRESS)
// import { RigidBody, CuboidCollider } from "@react-three/rapier";
// import { useControls } from "leva";
// import { useRef } from "react";
// import { useFrame } from "@react-three/fiber";
// import * as THREE from "three";
// import { useGameStore } from "@/store/useGameStore";
//
// type LuncherGateProps = {
//   nodes: any;
//   materials: any;
// };
//
// export default function LauncherGate({ nodes, materials }: LuncherGateProps) {
//   const ballInLauncher = useGameStore((state) => state.ballInLauncher);
//   const setBallInLauncher = useGameStore((state) => state.setBallInLauncher);
//
//   const gateMeshRef = useRef<THREE.Mesh>(null);
//
//   // 1. Un simple interrupteur pour savoir si la porte est ouverte ou fermée
//   const isOpen = useRef(false);
//
//   // 2. Leva pour la position du capteur
//   const { gateStartX, gateStartY, gateStartZ } = useControls(
//     "Gate sensors Position",
//     {
//       gateStartX: { value: 8.5, min: -20, max: 20, step: 0.1 },
//       gateStartY: { value: -1.6, min: -20, max: 20, step: 0.1 },
//       gateStartZ: { value: 5.9, min: -20, max: 80, step: 0.1 },
//     },
//   );
//
//   // 3. Leva pour trouver le "Mix" parfait de rotation d'ouverture !
//   const { openRotX, openRotY, openRotZ } = useControls("Gate Animation Axes", {
//     openRotX: { value: 0.4, min: -Math.PI, max: Math.PI, step: 0.1 },
//     openRotY: { value: -0.4, min: -Math.PI, max: Math.PI, step: 0.1 },
//     openRotZ: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.1 },
//   });
//
//   // 4. Animation sur les 3 axes en même temps
//   useFrame((_, delta) => {
//     if (gateMeshRef.current) {
//       // Si c'est ouvert, on vise les valeurs de Leva. Si fermé, on vise 0 (position initiale).
//       const targetX = isOpen.current ? openRotX : 0;
//       const targetY = isOpen.current ? openRotY : 0;
//       const targetZ = isOpen.current ? openRotZ : 0;
//
//       // On anime (lerp) chaque axe indépendamment
//       gateMeshRef.current.rotation.x = THREE.MathUtils.lerp(
//         gateMeshRef.current.rotation.x,
//         targetX,
//         delta * 10,
//       );
//       gateMeshRef.current.rotation.y = THREE.MathUtils.lerp(
//         gateMeshRef.current.rotation.y,
//         targetY,
//         delta * 10,
//       );
//       gateMeshRef.current.rotation.z = THREE.MathUtils.lerp(
//         gateMeshRef.current.rotation.z,
//         targetZ,
//         delta * 10,
//       );
//     }
//   });
//
//   return (
//     <group>
//       <RigidBody
//         type="fixed"
//         sensor
//         onIntersectionEnter={(e) => {
//           if (e.other.rigidBodyObject?.name === "ball") {
//             // 🎬 On ouvre la porte ! (useFrame fera le calcul vers les valeurs Leva)
//             isOpen.current = true;
//
//             setTimeout(() => {
//               // 🎬 On referme la porte
//               isOpen.current = false;
//               // 🔒 On active le mur invisible
//               setBallInLauncher(false);
//             }, 500);
//           }
//         }}
//         position={[gateStartX, gateStartY, gateStartZ]}
//         rotation={[0, Math.PI / 2.6, 0]}
//       >
//         <CuboidCollider args={[1, 1, 0.2]} />
//       </RigidBody>
//
//       <mesh
//         ref={gateMeshRef}
//         geometry={nodes.visual_obj_gate_5.geometry}
//         material={materials.PaletteMaterial001}
//         position={[8.733, -1.018, 5.992]}
//       />
//
//       {!ballInLauncher && (
//         <RigidBody
//           includeInvisible
//           type="fixed"
//           colliders="hull"
//           restitution={0}
//         >
//           <mesh
//             visible={false}
//             geometry={nodes.coll_gate.geometry}
//             position={[8.733, -1.272, 5.992]}
//           />
//         </RigidBody>
//       )}
//     </group>
//   );
// }
