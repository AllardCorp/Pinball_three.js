import { useRef, useState, useEffect, useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, folder, button } from "leva";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

type ConfigItem = { pos: [number, number, number]; rotY: number };

const DEFAULT_CONFIG: ConfigItem[] = [
  { pos: [-8.7, -2.47, 0.85], rotY: 0.3 },
  { pos: [-9.65, -2.47, -2], rotY: 0.3 },
  { pos: [-10.4, -2.47, -4.9], rotY: 0.25 },
  { pos: [-11, -2.47, -7.8], rotY: 0.2 },
  { pos: [-11.4, -2.47, -10.9], rotY: 0.05 },
  { pos: [-11.25, -2.47, -14.03], rotY: -0.3 },
  { pos: [-9.3, -2.47, -17.02], rotY: -0.8 },
  { pos: [-6.58, -2.47, -18.55], rotY: -1.2 },
  { pos: [-3.29, -2.47, -19.2], rotY: -1.4 },
  { pos: [0.1, -2.47, -19.2], rotY: -1.9 },
];

const COMBO_TIME_LIMIT = 1800;

export default function LightningRoad() {
  const [litSensors, setLitSensors] = useState<boolean[]>(
    new Array(DEFAULT_CONFIG.length).fill(false),
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addScore = useGameStore((state) => state.addScore);
  const activateMultiplier = useGameStore((state) => state.activateMultiplier);
  const displayMessage = useGameStore((state) => state.displayMessage);

  // OUTIL DE LEVEL DESIGN
  // Pas de la config leva global car utile pour le debug et pas pour le gameplay
  const schema = useMemo(() => {
    const acc: Record<string, any> = {
      debugMode: { value: false, label: "Activer Édition" },
    };

    DEFAULT_CONFIG.forEach((config, i) => {
      acc[`Sensor_${i + 1}`] = folder({
        [`x${i}`]: { value: config.pos[0], step: 0.1 },
        [`y${i}`]: { value: config.pos[1], step: 0.1 },
        [`z${i}`]: { value: config.pos[2], step: 0.1 },
        [`r${i}`]: {
          value: config.rotY,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: "Rotation Y",
        },
      });
    });

    acc["Log Positions"] = button((get) => {
      const result =
        `[\n` +
        DEFAULT_CONFIG.map(
          (_, i) =>
            `  { pos: [${get(`x${i}`).toFixed(2)}, ${get(`y${i}`).toFixed(2)}, ${get(`z${i}`).toFixed(2)}], rotY: ${get(`r${i}`).toFixed(2)} },`,
        ).join("\n") +
        `\n]`;
      console.log("Nouvelle configuration Lightning Road :\n" + result);
    });

    return acc;
  }, []);

  const controls = useControls(
    "Lightning Road",
    {
      // TS n'analyse pas le contenu du dossier dynamique
      LevelDesign: folder(schema as any),
    },
    { collapsed: true },
  ) as any; // Force le type de sortie global

  // Certifie à TS que debugMode est un booléen strict
  const debugMode: boolean = Boolean(controls.debugMode);

  const configuration: ConfigItem[] = useMemo(() => {
    if (debugMode) {
      return DEFAULT_CONFIG.map((config, i) => ({
        pos: [
          Number(controls[`x${i}`] ?? config.pos[0]),
          Number(controls[`y${i}`] ?? config.pos[1]),
          Number(controls[`z${i}`] ?? config.pos[2]),
        ] as [number, number, number],
        rotY: Number(controls[`r${i}`] ?? config.rotY),
      }));
    }
    return DEFAULT_CONFIG;
  }, [debugMode, controls]);

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
      }, COMBO_TIME_LIMIT);

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
      {configuration.map(({ pos, rotY }, index) => {
        // En mode debug, injecte les coordonnées dans la "key"
        // Ça force React/Rapier à remonter le capteur quand on bouge un slider, appliquant la physique.
        const rigidKey = debugMode
          ? `lightning_node_${index}_${pos[0]}_${pos[1]}_${pos[2]}_${rotY}`
          : `lightning_node_${index}`;

        return (
          <RigidBody
            key={rigidKey}
            type="fixed"
            colliders={false}
            position={pos}
          >
            <group rotation={[0, rotY, 0]}>
              {/* LE VISUEL */}
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.4, 0]}
                visible={debugMode || litSensors[index]}
              >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                  color={litSensors[index] ? "#00ff00" : "#ff0000"}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={debugMode && !litSensors[index] ? 0.8 : 1}
                />
              </mesh>

              {/* LA ZONE DE COLLISION */}
              <CuboidCollider
                args={[0.8, 0.5, 0.2]}
                sensor
                onIntersectionEnter={(e) => {
                  if (e.other.rigidBodyObject?.name === "ball" && !debugMode) {
                    console.log(`💡 Capteur ${index + 1} touché !`);
                    handleSensorHit(index);
                  }
                }}
              />
            </group>
          </RigidBody>
        );
      })}
    </group>
  );
}
