// import { RigidBody, CuboidCollider } from "@react-three/rapier";
// import { useGameStore } from "@/store/gameStore/useGameStore";
// import { useControls, folder } from "leva";
// import type { SCORE_VALUES } from "@/config/gameBalancingConfig";
//
// export default function OOBKillZone() {
//   // 💡 Récupération de ta fonction pour perdre la bille
//   const loseBall = useGameStore((state) => state.loseBall);
//
//   // =========================================================================
//   // 🛠️ OUTIL DE LEVEL DESIGN (Leva)
//   // =========================================================================
//   const { debugZone, yPos, width, height, depth } = useControls(
//     "Sécurité (Kill Zone)",
//     {
//       "Zone Hors Limites": folder({
//         debugZone: { value: false, label: "Afficher la Zone" },
//         // Position Y : à placer bien en dessous du plateau (ex: -5 ou -10)
//         yPos: { value: -10, step: 0.5, label: "Hauteur (Y)" },
//         // Dimensions de la boîte (très large pour tout attraper)
//         width: { value: 30, min: 10, max: 100, step: 1, label: "Largeur (X)" },
//         height: {
//           value: 1,
//           min: 0.1,
//           max: 10,
//           step: 0.1,
//           label: "Épaisseur (Y)",
//         },
//         depth: {
//           value: 40,
//           min: 10,
//           max: 100,
//           step: 1,
//           label: "Profondeur (Z)",
//         },
//       }),
//     },
//   );
//   // =========================================================================
//
//   const handleKillZoneHit = (e: any) => {
//     if (e.other.rigidBodyObject?.name === "ball") {
//       console.warn(
//         "⚠️ ALERTE GLITCH : La bille est sortie du plateau ! Destruction en cours...",
//       );
//
//       const ballId = e.other.rigidBodyObject.userData?.id;
//       // On déclenche la perte de la bille
//       loseBall(ballId);
//     }
//   };
//
//   return (
//     <group name="kill_zone">
//       <RigidBody type="fixed" colliders={false} sensor position={[0, yPos, 0]}>
//         <CuboidCollider
//           args={[width, height, depth]}
//           onIntersectionEnter={handleKillZoneHit}
//         />
//
//         {/* VISUEL DE DEBUG (Rouge transparent) */}
//         {debugZone && (
//           <mesh>
//             <boxGeometry args={[width * 2, height * 2, depth * 2]} />
//             <meshBasicMaterial
//               color="red"
//               wireframe={false}
//               transparent
//               opacity={0.2}
//             />
//           </mesh>
//         )}
//       </RigidBody>
//     </group>
//   );
// }
//
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, folder } from "leva";

export default function KillZone() {
  const loseBall = useGameStore((state) => state.loseBall);

  // OUTIL DE LEVEL DESIGN (Leva)
  // Pas dans la config leva global car utile pour le debug et pas pour le gameplay
  const { debugZone, cx, cy, cz, w, h, d } = useControls(
    "Sécurité (Kill Zone)",
    {
      "Volume de confinement": folder(
        {
          debugZone: { value: false, label: "Afficher la Zone" },
          cx: { value: 0, step: 0.5, label: "Centre X" },
          cy: { value: 2, step: 0.5, label: "Centre Y" },
          cz: { value: 0, step: 0.5, label: "Centre Z" },
          w: {
            value: 36,
            min: 5,
            max: 100,
            step: 1,
            label: "Largeur interne (X)",
          },
          h: {
            value: 15,
            min: 5,
            max: 100,
            step: 1,
            label: "Hauteur interne (Y)",
          },
          d: {
            value: 80,
            min: 5,
            max: 100,
            step: 1,
            label: "Profondeur interne (Z)",
          },
        },
        { collapsed: true },
      ),
    },
  );
  // =========================================================================

  // Fonction de détection qui prend le nom du mur en paramètre
  const handleKillZoneHit = (boundaryName: string) => (e: any) => {
    if (e.other.rigidBodyObject?.name === "ball") {
      console.warn(
        `⚠️ ALERTE GLITCH : La bille a quitté le plateau via le RigidBody : [${boundaryName}]`,
      );
      const ballId = e.other.rigidBodyObject.userData?.id;
      // On déclenche la perte de la bille
      loseBall(ballId);
    }
  };

  // Épaisseur de chaque boîte capteur
  const t = 1;

  return (
    <group name="kill_zone" position={[cx, cy, cz]}>
      {/* 1. SOL */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("SOL")}
      >
        <CuboidCollider
          args={[w / 2 + t * 2, t, d / 2 + t * 2]}
          position={[0, -h / 2 - t, 0]}
        />
      </RigidBody>

      {/*2. PLAFOND */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("PLAFOND")}
      >
        <CuboidCollider
          args={[w / 2 + t * 2, t, d / 2 + t * 2]}
          position={[0, h / 2 + t, 0]}
        />
      </RigidBody>

      {/* MUR GAUCHE */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_GAUCHE")}
      >
        <CuboidCollider
          args={[t, h / 2, d / 2]}
          position={[-w / 2 - t, 0, 0]}
        />
      </RigidBody>

      {/* MUR DROIT */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_DROIT")}
      >
        <CuboidCollider args={[t, h / 2, d / 2]} position={[w / 2 + t, 0, 0]} />
      </RigidBody>

      {/* MUR AVANT */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_AVANT")}
      >
        <CuboidCollider args={[w / 2, h / 2, t]} position={[0, 0, d / 2 + t]} />
      </RigidBody>

      {/* MUR ARRIÈRE */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_ARRIERE")}
      >
        <CuboidCollider
          args={[w / 2, h / 2, t]}
          position={[0, 0, -d / 2 - t]}
        />
      </RigidBody>

      {/* VISUEL DE DEBUG */}
      {debugZone && (
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial
            color="red"
            wireframe={true}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}
