// import { useRef, useState, useEffect, useMemo } from "react";
// import { CuboidCollider, RigidBody } from "@react-three/rapier";
// import * as THREE from "three";
// import { useGameStore } from "@/store/gameStore/useGameStore";
// import { useControls, folder, button } from "leva";
// import { SCORE_VALUES } from "@/config/gameBalancingConfig";
//
// type ConfigItem = { pos: [number, number, number]; rotY: number };
//
// const DEFAULT_CONFIG: ConfigItem[] = [
//   { pos: [-8.7, -2.47, 0.85], rotY: 0.3 },
//   { pos: [-9.65, -2.47, -2], rotY: 0.3 },
//   { pos: [-10.4, -2.47, -4.9], rotY: 0.25 },
//   { pos: [-11, -2.47, -7.8], rotY: 0.2 },
//   { pos: [-11.4, -2.47, -10.9], rotY: 0.05 },
//   { pos: [-11.25, -2.47, -14.03], rotY: -0.3 },
//   { pos: [-9.3, -2.47, -17.02], rotY: -0.8 },
//   { pos: [-6.58, -2.47, -18.55], rotY: -1.2 },
//   { pos: [-3.29, -2.47, -19.2], rotY: -1.4 },
//   { pos: [0.1, -2.47, -19.2], rotY: -1.9 },
// ];
//
// const COMBO_TIME_LIMIT = 1800;
//
// export default function LightningRoad() {
//   const [litSensors, setLitSensors] = useState<boolean[]>(
//     new Array(DEFAULT_CONFIG.length).fill(false),
//   );
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//
//   const addScore = useGameStore((state) => state.addScore);
//   const activateMultiplier = useGameStore((state) => state.activateMultiplier);
//   const displayMessage = useGameStore((state) => state.displayMessage);
//
//   // OUTIL DE LEVEL DESIGN
//   // Pas de la config leva global car utile pour le debug et pas pour le gameplay
//   const schema = useMemo(() => {
//     const acc: Record<string, any> = {
//       debugMode: { value: false, label: "Activer Édition" },
//     };
//
//     DEFAULT_CONFIG.forEach((config, i) => {
//       acc[`Sensor_${i + 1}`] = folder({
//         [`x${i}`]: { value: config.pos[0], step: 0.1 },
//         [`y${i}`]: { value: config.pos[1], step: 0.1 },
//         [`z${i}`]: { value: config.pos[2], step: 0.1 },
//         [`r${i}`]: {
//           value: config.rotY,
//           min: -Math.PI,
//           max: Math.PI,
//           step: 0.05,
//           label: "Rotation Y",
//         },
//       });
//     });
//
//     acc["Log Positions"] = button((get) => {
//       const result =
//         `[\n` +
//         DEFAULT_CONFIG.map(
//           (_, i) =>
//             `  { pos: [${get(`x${i}`).toFixed(2)}, ${get(`y${i}`).toFixed(2)}, ${get(`z${i}`).toFixed(2)}], rotY: ${get(`r${i}`).toFixed(2)} },`,
//         ).join("\n") +
//         `\n]`;
//       console.log("Nouvelle configuration Lightning Road :\n" + result);
//     });
//
//     return acc;
//   }, []);
//
//   const controls = useControls(
//     "Lightning Road",
//     {
//       // TS n'analyse pas le contenu du dossier dynamique
//       LevelDesign: folder(schema as any),
//     },
//     { collapsed: true },
//   ) as any; // Force le type de sortie global
//
//   // Certifie à TS que debugMode est un booléen strict
//   const debugMode: boolean = Boolean(controls.debugMode);
//
//   const configuration: ConfigItem[] = useMemo(() => {
//     if (debugMode) {
//       return DEFAULT_CONFIG.map((config, i) => ({
//         pos: [
//           Number(controls[`x${i}`] ?? config.pos[0]),
//           Number(controls[`y${i}`] ?? config.pos[1]),
//           Number(controls[`z${i}`] ?? config.pos[2]),
//         ] as [number, number, number],
//         rotY: Number(controls[`r${i}`] ?? config.rotY),
//       }));
//     }
//     return DEFAULT_CONFIG;
//   }, [debugMode, controls]);
//
//   const evaluateCombo = (currentLitState: boolean[]) => {
//     const litCount = currentLitState.filter(Boolean).length;
//     if (litCount === 0) return;
//
//     const basePoints = litCount * SCORE_VALUES.lightningRoadSensor;
//
//     if (litCount === configuration.length) {
//       const totalPoints = basePoints + SCORE_VALUES.lightningRoadJackpot;
//       console.log(`⚡ LIGHTNING ROAD COMPLETE ! Total : ${totalPoints} pts`);
//       addScore(totalPoints);
//       activateMultiplier("lightRoad", 2, 15000);
//       displayMessage("⚡ LIGHTNING ROAD x2 !!", 4000);
//     } else {
//       console.log(
//         `Lightning Road : Temps écoulé. ${litCount} touchés -> ${basePoints} pts`,
//       );
//       addScore(basePoints);
//     }
//
//     setLitSensors(new Array(configuration.length).fill(false));
//   };
//
//   const handleSensorHit = (index: number) => {
//     setLitSensors((prev) => {
//       if (prev[index]) return prev;
//
//       const newState = [...prev];
//       newState[index] = true;
//
//       if (timerRef.current) clearTimeout(timerRef.current);
//
//       if (newState.every(Boolean)) {
//         evaluateCombo(newState);
//         return new Array(configuration.length).fill(false);
//       }
//
//       timerRef.current = setTimeout(() => {
//         evaluateCombo(newState);
//       }, COMBO_TIME_LIMIT);
//
//       return newState;
//     });
//   };
//
//   useEffect(() => {
//     return () => {
//       if (timerRef.current) clearTimeout(timerRef.current);
//     };
//   }, []);
//
//   return (
//     <group name="lightning_road">
//       {configuration.map(({ pos, rotY }, index) => {
//         // En mode debug, injecte les coordonnées dans la "key"
//         // Ça force React/Rapier à remonter le capteur quand on bouge un slider, appliquant la physique.
//         const rigidKey = debugMode
//           ? `lightning_node_${index}_${pos[0]}_${pos[1]}_${pos[2]}_${rotY}`
//           : `lightning_node_${index}`;
//
//         return (
//           <RigidBody
//             key={rigidKey}
//             type="fixed"
//             colliders={false}
//             position={pos}
//           >
//             <group rotation={[0, rotY, 0]}>
//               {/* LE VISUEL */}
//               <mesh
//                 rotation={[-Math.PI / 2, 0, 0]}
//                 position={[0, -0.4, 0]}
//                 visible={debugMode || litSensors[index]}
//               >
//                 <planeGeometry args={[1, 1]} />
//                 <meshBasicMaterial
//                   color={litSensors[index] ? "#00ff00" : "#ff0000"}
//                   side={THREE.DoubleSide}
//                   transparent
//                   opacity={debugMode && !litSensors[index] ? 0.8 : 1}
//                 />
//               </mesh>
//
//               {/* LA ZONE DE COLLISION */}
//               <CuboidCollider
//                 args={[0.8, 0.5, 0.2]}
//                 sensor
//                 onIntersectionEnter={(e) => {
//                   if (e.other.rigidBodyObject?.name === "ball" && !debugMode) {
//                     console.log(`💡 Capteur ${index + 1} touché !`);
//                     handleSensorHit(index);
//                   }
//                 }}
//               />
//             </group>
//           </RigidBody>
//         );
//       })}
//     </group>
//   );
// }
import { useRef, useState, useEffect, useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, folder, button } from "leva";
import {
  SCORE_VALUES,
  LIGHTROAD_COMBO_TIME_LIMIT,
} from "@/config/gameBalancingConfig";
type RuneConfig = {
  node: string;
  mat: string;
  pos: [number, number, number];
  scale: [number, number, number];
  rotY: number;
};
// La configuration unique avec les valeurs exactes de Blender
// "rotY" pour oriente les hitbox invisible le long du chemin.
const RUNES_CONFIG: RuneConfig[] = [
  {
    node: "visual_rune1_on",
    mat: "M_rune1_on",
    pos: [-8.349, -2.849, 0.5],
    scale: [1, 1, 1],
    rotY: 0.3,
  },
  {
    node: "visual_rune2_on",
    mat: "M_rune2_on",
    pos: [-9.29, -2.849, -2.186],
    scale: [0.798, 1, 0.881],
    rotY: 0.3,
  },
  {
    node: "visual_rune3_on",
    mat: "M_rune3_on",
    pos: [-10.015, -2.849, -5.019],
    scale: [0.798, 1, 0.881],
    rotY: 0.25,
  },
  {
    node: "visual_rune4_on",
    mat: "M_rune4_on",
    pos: [-10.63, -2.849, -7.835],
    scale: [0.798, 1, 0.881],
    rotY: 0.2,
  },
  {
    node: "visual_rune5_on",
    mat: "M_rune5_on",
    pos: [-11.023, -2.849, -10.723],
    scale: [0.798, 1, 0.881],
    rotY: 0.05,
  },
  {
    node: "visual_rune6_on",
    mat: "M_rune6_on",
    pos: [-10.911, -2.849, -13.803],
    scale: [0.798, 1, 0.881],
    rotY: -0.3,
  },
  {
    node: "visual_rune7_on",
    mat: "M_rune7_on",
    pos: [-9.194, -2.849, -16.598],
    scale: [0.798, 1, 0.881],
    rotY: -0.8,
  },
  {
    node: "visual_rune8_on",
    mat: "M_rune8_on",
    pos: [-6.505, -2.849, -18.052],
    scale: [0.806, 1, 0.891],
    rotY: -1.2,
  },
  {
    node: "visual_rune9_on",
    mat: "M_rune9_on",
    pos: [-3.198, -2.849, -18.749],
    scale: [0.806, 1, 0.891],
    rotY: -1.4,
  },
  {
    node: "visual_rune10_on",
    mat: "M_rune10_on",
    pos: [0.093, -2.849, -18.684],
    scale: [0.798, 1, 0.881],
    rotY: -1.9,
  },
];

export default function LightningRoad({
  nodes,
  materials,
}: {
  nodes: any;
  materials: any;
}) {
  const [litSensors, setLitSensors] = useState<boolean[]>(
    new Array(RUNES_CONFIG.length).fill(false),
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addScore = useGameStore((state) => state.addScore);
  const activateMultiplier = useGameStore((state) => state.activateMultiplier);
  const displayMessage = useGameStore((state) => state.displayMessage);

  // OUTIL DE LEVEL DESIGN (Leva)
  // Pas dans la config leva global car utile pour le debug et pas pour le gameplay
  const schema = useMemo(() => {
    const acc: Record<string, any> = {
      debugMode: { value: false, label: "Activer Édition" },
    };

    RUNES_CONFIG.forEach((config, i) => {
      acc[`Sensor_${i + 1}`] = folder({
        [`x${i}`]: { value: config.pos[0], step: 0.1 },
        [`y${i}`]: { value: config.pos[1], step: 0.1 },
        [`z${i}`]: { value: config.pos[2], step: 0.1 },
        [`r${i}`]: {
          value: config.rotY,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: "Rotation Hitbox",
        },
      });
    });

    acc["Log Positions"] = button(() => {
      console.log(
        "Les positions peuvent être copiées depuis l'UI Leva si modifiées.",
      );
    });

    return acc;
  }, []);

  const controls = useControls(
    "Lightning Road",
    { LevelDesign: folder(schema as any) },
    { collapsed: true },
  ) as any;

  const debugMode: boolean = Boolean(controls.debugMode);

  const configuration = useMemo(() => {
    if (debugMode) {
      return RUNES_CONFIG.map((config, i) => ({
        ...config,
        pos: [
          Number(controls[`x${i}`] ?? config.pos[0]),
          Number(controls[`y${i}`] ?? config.pos[1]),
          Number(controls[`z${i}`] ?? config.pos[2]),
        ] as [number, number, number],
        rotY: Number(controls[`r${i}`] ?? config.rotY),
      }));
    }
    return RUNES_CONFIG;
  }, [debugMode, controls]);
  // =========================================================================

  const evaluateCombo = (currentLitState: boolean[]) => {
    const litCount = currentLitState.filter(Boolean).length;
    if (litCount === 0) return;

    const basePoints = litCount * SCORE_VALUES.lightningRoadSensor;

    if (litCount === configuration.length) {
      const totalPoints = basePoints + SCORE_VALUES.lightningRoadJackpot;
      console.log(`⚡ LIGHTNING ROAD COMPLETE ! Total : ${totalPoints} pts`);
      addScore(totalPoints);
      activateMultiplier("lightRoad", 2, 15000);
      displayMessage("⚡ LIGHTNING ROAD x2 !!", 4000);
    } else {
      console.log(
        `Lightning Road : Temps écoulé. ${litCount} touchés -> ${basePoints} pts`,
      );
      addScore(basePoints);
    }

    setLitSensors(new Array(configuration.length).fill(false));
  };

  const handleSensorHit = (index: number) => {
    setLitSensors((prev) => {
      if (prev[index]) return prev;

      const newState = [...prev];
      newState[index] = true;

      if (timerRef.current) clearTimeout(timerRef.current);

      if (newState.every(Boolean)) {
        evaluateCombo(newState);
        return new Array(configuration.length).fill(false);
      }

      timerRef.current = setTimeout(() => {
        evaluateCombo(newState);
      }, LIGHTROAD_COMBO_TIME_LIMIT);

      return newState;
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <group name="lightning_road">
      {configuration.map((config, index) => {
        const rigidKey = debugMode
          ? `lightning_node_${index}_${config.pos[0]}_${config.pos[1]}_${config.pos[2]}_${config.rotY}`
          : `lightning_node_${index}`;

        return (
          <group key={`rune_group_${index}`}>
            {/* Visuel avec : Position, échelle et rotation natifs */}
            <mesh
              name={config.node}
              geometry={nodes[config.node].geometry}
              material={materials[config.mat]}
              position={config.pos}
              scale={config.scale as [number, number, number]}
              // Apparaît si allumé ou si on est en train de régler avec Leva
              visible={debugMode || litSensors[index]}
            />

            {/* SENSORS (Superposée au visuel) */}
            <RigidBody
              key={rigidKey}
              type="fixed"
              colliders={false}
              position={config.pos} // Centre le capteur exactement sur la position de la rune
              rotation={[0, config.rotY, 0]} // Tourne la boîte pour suivre le chemin
            >
              <CuboidCollider
                args={[0.8, 0.5, 0.4]}
                // Comme 'pos' est au sol, on surélève la boîte de collision localement
                // pour que la bille puisse la traverser sans toucher le sol.
                position={[0, 0.5, 0]}
                sensor
                onIntersectionEnter={(e) => {
                  if (e.other.rigidBodyObject?.name === "ball" && !debugMode) {
                    console.log(`💡 Capteur ${index + 1} touché !`);
                    handleSensorHit(index);
                  }
                }}
              />

              {/* VISUEL DE DEBUG */}
              {debugMode && (
                <mesh position={[0, 0.5, 0]}>
                  <boxGeometry args={[1.6, 1.0, 0.8]} />
                  <meshBasicMaterial color="magenta" wireframe />
                </mesh>
              )}
            </RigidBody>
          </group>
        );
      })}
    </group>
  );
}
