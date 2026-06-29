import { useState, useRef, type ReactNode } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useControls, folder } from "leva";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

type DrumBumperProps = {
  id: string;
  position: [number, number, number];
  children: ReactNode;
  defaultDirection?: [number, number, number];
  defaultForce?: number;
  defaultSensorOffset?: [number, number, number];
  defaultSensorSize?: [number, number, number];
  defaultSensorRotation?: [number, number, number];
};

export default function DrumBumper({
  id,
  position,
  children,
  defaultDirection = [-1, 0, -0.15],
  defaultForce = 20,
  defaultSensorOffset = [-1.3, 0, -3.15],
  defaultSensorSize = [0.7, 0.8, 0.1],
  defaultSensorRotation = [0, -1.4, 0],
}: DrumBumperProps) {
  const addScore = useGameStore((state) => state.addScore);

  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const visualGroupRef = useRef<THREE.Group>(null);
  const animImpact = useRef(0);

  // OUTIL DE LEVEL DESIGN (Leva)
  const {
    debugMode,
    dirX,
    dirY,
    dirZ,
    force,
    ox,
    oy,
    oz,
    width,
    height,
    depth,
    rx,
    ry,
    rz,
  } = useControls("Drum Bumpers", {
    [`Bumper: ${id}`]: folder(
      {
        debugMode: { value: false, label: "Afficher Debug" },
        Direction: folder({
          dirX: {
            value: defaultDirection[0],
            min: -1,
            max: 1,
            step: 0.01,
            label: "Dir X",
          },
          dirY: {
            value: defaultDirection[1],
            min: -1,
            max: 1,
            step: 0.01,
            label: "Dir Y",
          },
          dirZ: {
            value: defaultDirection[2],
            min: -1,
            max: 1,
            step: 0.01,
            label: "Dir Z",
          },
          force: {
            value: defaultForce,
            min: 0,
            max: 200,
            step: 5,
            label: "Puissance",
          },
        }),
        "Position Sensor": folder({
          ox: { value: defaultSensorOffset[0], step: 0.01, label: "Offset X" },
          oy: { value: defaultSensorOffset[1], step: 0.01, label: "Offset Y" },
          oz: { value: defaultSensorOffset[2], step: 0.01, label: "Offset Z" },
        }),
        "Rotation Sensor": folder({
          rx: {
            value: defaultSensorRotation[0],
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
            label: "Rot X",
          },
          ry: {
            value: defaultSensorRotation[1],
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
            label: "Rot Y",
          },
          rz: {
            value: defaultSensorRotation[2],
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
            label: "Rot Z",
          },
        }),
        "Taille Sensor": folder({
          width: {
            value: defaultSensorSize[0],
            min: 0.1,
            step: 0.05,
            label: "Largeur (X)",
          },
          height: {
            value: defaultSensorSize[1],
            min: 0.1,
            step: 0.05,
            label: "Hauteur (Y)",
          },
          depth: {
            value: defaultSensorSize[2],
            min: 0.1,
            step: 0.05,
            label: "Épaisseur (Z)",
          },
        }),
      },
      { collapsed: true },
    ),
  });

  // ANIMATION D'IMPACT (Boucle de rendu 60fps)
  useFrame((_, delta) => {
    if (!visualGroupRef.current) return;

    if (animImpact.current > 0) {
      animImpact.current = THREE.MathUtils.lerp(
        animImpact.current,
        0,
        delta * 8, // Vitesse de retour à la position initiale (ajustable)
      );
      if (animImpact.current < 0.01) animImpact.current = 0;
    }

    // Décalage X pour l'impact
    const maxRecoilX = -0.3;
    const currentOffsetX = maxRecoilX * animImpact.current;

    visualGroupRef.current.position.set(
      position[0] + currentOffsetX,
      position[1],
      position[2],
    );
  });

  const handleHit = (e: any) => {
    if (isOnCooldown) return;

    if (e.other.rigidBodyObject?.name === "ball") {
      const ballRigidBody = e.other.rigidBody;

      if (ballRigidBody) {
        ballRigidBody.wakeUp();

        const impulse = { x: dirX * force, y: dirY * force, z: dirZ * force };
        ballRigidBody.applyImpulse(impulse, true);

        console.log(`Bumper [${id}] percuté !`);
        addScore(SCORE_VALUES.drumBumper);

        // DÉCLENCHEMENT DE L'ANIMATION
        animImpact.current = 1;

        setIsOnCooldown(true);
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          setIsOnCooldown(false);
        }, 100);
      }
    }
  };

  const sensorPosition: [number, number, number] = [
    position[0] + ox,
    position[1] + oy,
    position[2] + oz,
  ];

  const rigidKey = debugMode
    ? `drum_sensor_${id}_${ox}_${oy}_${oz}_${rx}_${ry}_${rz}_${width}_${height}_${depth}`
    : `drum_sensor_${id}`;

  return (
    <group name={`drum_bumper_wrapper_${id}`}>
      {/* GROUPE VISUEL ANIMÉ */}
      <group
        ref={visualGroupRef}
        name={`visual_drum_${id}`}
        position={position}
        visible={!debugMode}
      >
        {/* Les meshes sont injectés depuis le composant parent */}
        {children}
      </group>

      {/* SENSOR PHYSIQUE */}
      <RigidBody
        key={rigidKey}
        type="fixed"
        colliders={false}
        position={sensorPosition}
        rotation={[rx, ry, rz]}
        sensor
        onIntersectionEnter={handleHit}
      >
        <CuboidCollider args={[width, height, depth]} />
        {debugMode && (
          <mesh>
            <boxGeometry args={[width * 2, height * 2, depth * 2]} />
            <meshBasicMaterial color="magenta" wireframe />
          </mesh>
        )}
      </RigidBody>

      {/* FLÈCHE DE DEBUG */}
      {debugMode && (
        <group
          position={[
            sensorPosition[0],
            sensorPosition[1] + 1.2,
            sensorPosition[2],
          ]}
        >
          <arrowHelper
            args={[
              new THREE.Vector3(dirX, dirY, dirZ).normalize(),
              new THREE.Vector3(0, 0, 0),
              1.5,
              0xff00ff,
              0.4,
              0.4,
            ]}
          />
        </group>
      )}
    </group>
  );
}
