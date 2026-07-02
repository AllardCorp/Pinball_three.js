import { useMemo, useState } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, folder, button } from "leva";
import type { MultiplierSource } from "@/config/gameBalancingConfig";

type MultiplierSensorProps = {
  id: string;
  multiplierName: MultiplierSource;
  defaultPosition?: [number, number, number];
  defaultRotation?: [number, number, number];
  defaultSize?: [number, number, number];
};

export default function MultiplierSensor({
  id,
  multiplierName,
  defaultPosition = [0, 0, 0],
  defaultRotation = [0, 0, 0],
  defaultSize = [0.4, 0.4, 0.4],
}: MultiplierSensorProps) {
  const activateMultiplier = useGameStore((state) => state.activateMultiplier);
  const displayMessage = useGameStore((state) => state.displayMessage);

  const [isOnCooldown, setIsOnCooldown] = useState(false);

  // OUTIL DE LEVEL DESIGN DYNAMIQUE
  // Pas de la config leva global car utile pour le debug et pas pour le gameplay
  const schema = useMemo(() => {
    return {
      [`Sensor: ${id}`]: folder(
        {
          [`${id}_debug`]: { value: false, label: "Mode Édition" },
          [`${id}_x`]: { value: defaultPosition[0], step: 0.1, label: "Pos X" },
          [`${id}_y`]: { value: defaultPosition[1], step: 0.1, label: "Pos Y" },
          [`${id}_z`]: { value: defaultPosition[2], step: 0.1, label: "Pos Z" },
          [`${id}_rx`]: {
            value: defaultRotation[0],
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
            label: "Rot X",
          },
          [`${id}_ry`]: {
            value: defaultRotation[1],
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
            label: "Rot Y",
          },
          [`${id}_rz`]: {
            value: defaultRotation[2],
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
            label: "Rot Z",
          },
          // Contrôles de taille
          [`${id}_sx`]: {
            value: defaultSize[0],
            min: 0.1,
            max: 10,
            step: 0.1,
            label: "Size X",
          },
          [`${id}_sy`]: {
            value: defaultSize[1],
            min: 0.1,
            max: 10,
            step: 0.1,
            label: "Size Y",
          },
          [`${id}_sz`]: {
            value: defaultSize[2],
            min: 0.1,
            max: 10,
            step: 0.1,
            label: "Size Z",
          },

          // Bouton d'export formaté pour copier-coller
          [`Log_${id}`]: button((get) => {
            const px = get(`${id}_x`).toFixed(2);
            const py = get(`${id}_y`).toFixed(2);
            const pz = get(`${id}_z`).toFixed(2);
            const rx = get(`${id}_rx`).toFixed(2);
            const ry = get(`${id}_ry`).toFixed(2);
            const rz = get(`${id}_rz`).toFixed(2);
            const sx = get(`${id}_sx`).toFixed(2);
            const sy = get(`${id}_sy`).toFixed(2);
            const sz = get(`${id}_sz`).toFixed(2);

            console.log(`\n--- Config pour le composant ---`);
            console.log(
              `<MultiplierSensor \n  id="${id}" \n  multiplierName="${multiplierName}" \n  defaultPosition={[${px}, ${py}, ${pz}]} \n  defaultRotation={[${rx}, ${ry}, ${rz}]} \n  defaultSize={[${sx}, ${sy}, ${sz}]} \n/>`,
            );
          }),
        },
        { collapsed: true },
      ),
    };
  }, [id, multiplierName, defaultPosition, defaultRotation, defaultSize]);

  const controls = useControls("Multiplier Sensors", schema as any) as any;

  // Lecture sécurisée des valeurs
  const debugMode: boolean = Boolean(controls[`${id}_debug`]);
  const x = Number(controls[`${id}_x`] ?? defaultPosition[0]);
  const y = Number(controls[`${id}_y`] ?? defaultPosition[1]);
  const z = Number(controls[`${id}_z`] ?? defaultPosition[2]);
  const rx = Number(controls[`${id}_rx`] ?? defaultRotation[0]);
  const ry = Number(controls[`${id}_ry`] ?? defaultRotation[1]);
  const rz = Number(controls[`${id}_rz`] ?? defaultRotation[2]);

  // Lecture de la taille dynamique
  const sx = Number(controls[`${id}_sx`] ?? defaultSize[0]);
  const sy = Number(controls[`${id}_sy`] ?? defaultSize[1]);
  const sz = Number(controls[`${id}_sz`] ?? defaultSize[2]);

  const handleHit = (e: any) => {
    if (e.other.rigidBodyObject?.name === "ball" && !isOnCooldown) {
      console.log(
        `🌀 Capteur [${id}] franchi ! Activation de ${multiplierName}`,
      );
      activateMultiplier(multiplierName);
      displayMessage(`${multiplierName.toUpperCase()}  ACTIVÉ !`, 3000);
      setIsOnCooldown(true);
      setTimeout(() => setIsOnCooldown(false), 500);
    }
  };

  // Intègre la taille dans la clé pour forcer Rapier à recréer le collider si on change ses dimensions
  const rigidKey = debugMode
    ? `sensor_${id}_${x}_${y}_${z}_${rx}_${ry}_${rz}_${sx}_${sy}_${sz}`
    : `sensor_${id}`;

  return (
    <RigidBody
      key={rigidKey}
      type="fixed"
      colliders={false}
      position={[x, y, z]}
      rotation={[rx, ry, rz]}
    >
      <mesh visible={debugMode}>
        {/* Multiplier par 2 le visuel  */}
        <boxGeometry args={[sx * 2, sy * 2, sz * 2]} />
        <meshBasicMaterial color="magenta" wireframe={true} />
      </mesh>

      <CuboidCollider
        args={[sx, sy, sz]}
        sensor
        onIntersectionEnter={handleHit}
      />
    </RigidBody>
  );
}
