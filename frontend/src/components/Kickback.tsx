import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useControls } from "leva";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
type KickbackProps = {
  side: "left" | "right";
  visualGeometry: THREE.BufferGeometry;
  visualMaterial: THREE.Material;
  visualPosition: [number, number, number];
  colliderGeometry: THREE.BufferGeometry;
  colliderPosition: [number, number, number];
  sensorPosition: [number, number, number];
  kickStrength?: number;
};

export default function Kickback({
  side,
  visualGeometry,
  visualMaterial,
  visualPosition,
  colliderGeometry,
  colliderPosition,
  sensorPosition,
  kickStrength = 100,
}: KickbackProps) {
  const isActive = useGameStore((state) =>
    side === "left" ? state.leftKickbackActive : state.rightKickbackActive,
  );
  const useKickback = useGameStore((state) => state.useKickback);
  const addScore = useGameStore((state) => state.addScore);
  const { leftOrientation, rightOrientation } = useControls("Kickbacks", {
    leftOrientation: { value: 6, min: -100, max: 100, step: 1 },
    rightOrientation: { value: -6, min: -100, max: 100, step: 1 },
  });
  return (
    <group>
      {/* CAPTEUR */}
      <RigidBody
        type="fixed"
        sensor
        position={sensorPosition}
        onIntersectionEnter={(e) => {
          if (
            e.other.rigidBodyObject?.name === "ball" &&
            e.other.rigidBody &&
            isActive
          ) {
            const ballBody = e.other.rigidBody;
            // 1. On tue la vitesse de chute
            e.other.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);

            // 2. Direction de l'impulsion
            const xDirection =
              side === "left" ? leftOrientation : rightOrientation;

            setTimeout(() => {
              ballBody.applyImpulse(
                { x: xDirection, y: 0, z: -kickStrength },
                true,
              );
            }, 1000);

            addScore(2500);

            // Fermeture de la porte après 300ms
            setTimeout(() => {
              useKickback(side);
            }, 1300);
          }
        }}
      >
        {/* Dimensions du capteur */}
        <CuboidCollider args={[1, 0.5, 0.5]} />
      </RigidBody>

      {/* PORTE DE CONDAMNATION */}
      {!isActive && (
        <RigidBody
          type="fixed"
          colliders="hull"
          position={colliderPosition}
          includeInvisible
          restitution={0.2}
        >
          <mesh
            geometry={visualGeometry}
            material={visualMaterial}
            // calcule de l'écart entre le RigidBody (collider) et la position voulue pour le visuel
            position={[
              visualPosition[0] - colliderPosition[0],
              visualPosition[1] - colliderPosition[1],
              visualPosition[2] - colliderPosition[2],
            ]}
          />
          <mesh visible={false} geometry={colliderGeometry} />
        </RigidBody>
      )}
    </group>
  );
}
