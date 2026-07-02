import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { BufferGeometry, Material } from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useState } from "react";
import ObjectSound from "@/components/sounds/ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";
import { useGameDebug } from "@/config/useGameDebug";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

type KickbackProps = {
  side: "left" | "right";
  visualGeometry: BufferGeometry;
  visualMaterial: Material;
  visualPosition: [number, number, number];
  colliderGeometry: BufferGeometry;
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
  const [kickCount, setKickCount] = useState(0);
  const addScore = useGameStore((state) => state.addScore);
  const { leftOrientation, rightOrientation } = useGameDebug();
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
              setKickCount((prev) => prev + 1);
            }, 1000);

            addScore(SCORE_VALUES.kickback);
            // Fermeture de la porte après 300ms
            setTimeout(() => {
              useKickback(side);
            }, 1300);
          }
        }}
      >
        {/* Dimensions du capteur */}
        <CuboidCollider args={[1, 0.5, 0.5]} />

        <ObjectSound
          {...SOUNDS_CONFIG.kickback.trigger}
          playTrigger={kickCount}
        />
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
