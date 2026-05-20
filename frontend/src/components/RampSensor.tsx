import { useState, useRef, useEffect } from "react";
import { RigidBody, CuboidCollider, IntersectionEnterPayload } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { useControls, folder } from "leva";
import { AudioErrorBoundary } from "@/components/AudioErrorBoundary";

type PlaneConfig = {
  pos: [number, number, number];
  rot: [number, number, number];
  size: [number, number]; // width, length (thickness will be 0.05 to make it a plane)
};

type RampSensorProps = {
  id: string; // Identifiant pour Leva
  soundUrl: string;
  pointsPerFrame?: number;
  playbackRate?: number;
  entryConfig?: PlaneConfig;
  exit1Config?: PlaneConfig;
  exit2Config?: PlaneConfig;
};

export default function RampSensor({ 
  id,
  soundUrl,
  pointsPerFrame = 1,
  playbackRate = 1,
  entryConfig = { pos: [0, 0, 0], rot: [0, 0, 0], size: [1, 1] },
  exit1Config = { pos: [-2, 0, -2], rot: [0, 0, 0], size: [1, 1] },
  exit2Config = { pos: [2, 0, -2], rot: [0, 0, 0], size: [1, 1] },
}: RampSensorProps) {
  const [isActive, setIsActive] = useState(false);
  const addScore = useGameStore((state) => state.addScore);
  const soundRef = useRef<THREE.PositionalAudio>(null);

  const { masterVolume } = useControls("Audio", {
    masterVolume: { value: 1, min: 0, max: 5, step: 0.1 },
  });

  const { rapierDebug } = useControls("rapier", {
    rapierDebug: true,
  });

  // Contrôles Leva pour les 3 plans
  const controls = useControls(`RampSensor ${id}`, {
    Entrée: folder({
      entryPos: { value: entryConfig.pos, step: 0.1 },
      entryRot: { value: entryConfig.rot, step: 0.05 },
      entrySize: { value: entryConfig.size, step: 0.1 },
    }),
    Sortie1: folder({
      exit1Pos: { value: exit1Config.pos, step: 0.1 },
      exit1Rot: { value: exit1Config.rot, step: 0.05 },
      exit1Size: { value: exit1Config.size, step: 0.1 },
    }),
    Sortie2: folder({
      exit2Pos: { value: exit2Config.pos, step: 0.1 },
      exit2Rot: { value: exit2Config.rot, step: 0.05 },
      exit2Size: { value: exit2Config.size, step: 0.1 },
    })
  });

  const activeRef = useRef(false);
  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useFrame((_, delta) => {
    if (activeRef.current) {
      addScore(pointsPerFrame);
    }

    // Gestion fluide du volume (Fade In / Fade Out)
    if (soundRef.current) {
      const audio = soundRef.current;
      const currentVol = audio.getVolume();

      if (activeRef.current) {
        // Le capteur est actif
        if (!audio.isPlaying) {
          audio.setVolume(0); // On commence à 0
          audio.setLoop(true);
          audio.setPlaybackRate(playbackRate);
          try {
            audio.play();
          } catch (err) {
            console.warn("Erreur audio:", err);
          }
        } else if (currentVol < masterVolume) {
          // Fade IN (augmente le volume doucement vers le masterVolume)
          audio.setVolume(THREE.MathUtils.lerp(currentVol, masterVolume, delta * 15));
        }
      } else {
        // Le capteur est inactif
        if (audio.isPlaying) {
          if (currentVol > 0.02) {
            // Fade OUT (baisse le volume très vite pour éviter le clic, mais pas instantanément)
            audio.setVolume(THREE.MathUtils.lerp(currentVol, 0, delta * 25));
          } else {
            // Quand le son est presque inaudible, on coupe proprement
            try {
              audio.stop();
            } catch (err) {}
          }
        }
      }
    }
  });

  const handleEntry = (e: IntersectionEnterPayload) => {
    if (e.colliderObject?.name === "ball" || e.other.rigidBodyObject?.name === "ball" || !e.other.rigidBodyObject?.name) {
      setIsActive(true);
    }
  };

  const handleExit = (e: IntersectionEnterPayload) => {
    if (e.colliderObject?.name === "ball" || e.other.rigidBodyObject?.name === "ball" || !e.other.rigidBodyObject?.name) {
      setIsActive(false);
    }
  };

  // Helper de rendu de plan
  const renderPlane = (pos: [number, number, number], rot: [number, number, number], size: [number, number], color: string, isEntry: boolean) => (
    <group position={pos} rotation={rot}>
      {/*args: half-extents, we use 0.05 for height to make it a thin plane */}
      <RigidBody
        type="fixed"
        sensor
        onIntersectionEnter={isEntry ? handleEntry : handleExit}
      >
        <CuboidCollider
          args={[size[0] / 2, 0.05, size[1] / 2]}
        />
      </RigidBody>
      {rapierDebug && (
        <mesh>
          <boxGeometry args={[size[0], 0.1, size[1]]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );

  return (
    <group>
      {/* 1 Entrée */}
      {renderPlane(controls.entryPos as [number, number, number], controls.entryRot as [number, number, number], controls.entrySize as [number, number], "green", true)}
      
      {/* 2 Sorties */}
      {renderPlane(controls.exit1Pos as [number, number, number], controls.exit1Rot as [number, number, number], controls.exit1Size as [number, number], "red", false)}
      {renderPlane(controls.exit2Pos as [number, number, number], controls.exit2Rot as [number, number, number], controls.exit2Size as [number, number], "red", false)}

      {/* Son placé globalement à l'entrée ou au centre */}
      <group position={controls.entryPos as [number, number, number]}>
        <AudioErrorBoundary url={soundUrl}>
          <PositionalAudio ref={soundRef} url={soundUrl} distance={15} />
        </AudioErrorBoundary>
      </group>
    </group>
  );
}
