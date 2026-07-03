import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PositionalAudio } from "@react-three/drei";
import type { RapierRigidBody } from "@react-three/rapier";
import { AudioErrorBoundary } from "@/components/sounds/AudioErrorBoundary";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";

type BallAudioProps = {
  ballRef: React.RefObject<RapierRigidBody | null>;
  size: number;
  isPlaying: boolean;
  currentSurfaceRef: React.MutableRefObject<string>;
};

export default function BallAudio({
  ballRef,
  size,
  isPlaying,
  currentSurfaceRef,
}: BallAudioProps) {
  const groupRef = useRef<THREE.Group>(null);
  const playfieldSoundRef = useRef<THREE.PositionalAudio | null>(null);
  const stoneRampSoundRef = useRef<THREE.PositionalAudio | null>(null);
  const rampsSoundRef = useRef<THREE.PositionalAudio | null>(null);

  const debugLineRef = useRef<THREE.Line>(null);

  const fadeOutSound = (audio: THREE.PositionalAudio, delta: number) => {
    if (!audio.isPlaying) return;
    const currentVol = audio.getVolume();
    if (currentVol > 0.05) {
      audio.setVolume(THREE.MathUtils.lerp(currentVol, 0, delta * 20));
    } else {
      try {
        audio.stop();
      } catch (e) {
        /* ignore */
      }
    }
  };

  useFrame((_, delta) => {
    const playfieldAudio = playfieldSoundRef.current;
    const rockAudio = stoneRampSoundRef.current;
    const rampsAudio = rampsSoundRef.current;

    const canUsePhysics =
      isPlaying && ballRef.current !== null;

    if (!canUsePhysics) {
      if (playfieldAudio) fadeOutSound(playfieldAudio, delta);
      if (rockAudio) fadeOutSound(rockAudio, delta);
      if (rampsAudio) fadeOutSound(rampsAudio, delta);
      return;
    }

    const body = ballRef.current!;
    const vel = body.linvel();
    const pos = body.translation();
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

    // Faire suivre le groupe audio (et la ligne de debug) à la position de la bille sans sa rotation
    if (groupRef.current) {
      groupRef.current.position.set(pos.x, pos.y, pos.z);
    }

    const surface = currentSurfaceRef.current;
    const isOnPlayfield = surface === "coll_playfield_collision_left_hole";
    const isOnRockRamp = surface === "stone_ramp" || surface === "coll_faquir";
    const isOnRamps = surface === "coll_ramps";

    // Mise à jour visuelle permanente du rayon de débug (en coordonnées locales du groupe)
    if (debugLineRef.current) {
      const positions = debugLineRef.current.geometry.attributes.position
        .array as Float32Array;
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      positions[3] = 0;
      positions[4] = -(size + 0.6);
      positions[5] = 0;
      debugLineRef.current.geometry.attributes.position.needsUpdate = true;

      const material = debugLineRef.current.material as THREE.LineBasicMaterial;
      material.color.set(
        isOnRockRamp
          ? "blue"
          : isOnRamps
            ? "yellow"
            : isOnPlayfield
              ? "lime"
              : "red",
      );
    }

    const isRollingFastEnough = speed > 0.5;

    const updateAudio = (
      audio: THREE.PositionalAudio | null,
      isActiveSurface: boolean,
    ) => {
      if (!audio) return;

      const shouldPlay = isRollingFastEnough && isActiveSurface;

      if (!audio.isPlaying && shouldPlay) {
        audio.setVolume(0);
        audio.setLoop(true);
        try {
          audio.play();
        } catch (e) {
          console.warn(e);
        }
      }

      if (audio.isPlaying) {
        if (shouldPlay) {
          // Utilisation de la configuration pour le son actif
          const conf =
            isActiveSurface && isOnRockRamp
              ? SOUNDS_CONFIG.ball.rollingRock
              : isActiveSurface && isOnRamps
                ? SOUNDS_CONFIG.ball.rollingRamps
                : SOUNDS_CONFIG.ball.rollingPlayfield;
          const div = conf.speedDivisor || 10;

          const targetVol = Math.min(speed / div, 1) * conf.volume;

          // Le pitch interpole entre pitchMin et pitchMax
          const pMin = conf.pitchMin || 0.5;
          const pMax = conf.pitchMax || 1;
          const targetPitch = pMin + Math.min(speed / div, 1) * (pMax - pMin);

          audio.setVolume(
            THREE.MathUtils.lerp(audio.getVolume(), targetVol, delta * 10),
          );
          audio.setPlaybackRate(
            THREE.MathUtils.lerp(audio.playbackRate, targetPitch, delta * 10),
          );
        } else {
          fadeOutSound(audio, delta);
        }
      }
    };

    updateAudio(playfieldAudio, isOnPlayfield);
    updateAudio(rockAudio, isOnRockRamp);
    updateAudio(rampsAudio, isOnRamps);
  });

  return (
    <group ref={groupRef}>
      {/* Son par défaut pour le plateau */}
      <AudioErrorBoundary
        url={SOUNDS_CONFIG.ball.rollingPlayfield.url as string}
      >
        <PositionalAudio
          ref={playfieldSoundRef}
          url={SOUNDS_CONFIG.ball.rollingPlayfield.url as string}
          distance={15}
        />
      </AudioErrorBoundary>
      {/* Son pour la rampe en pierre */}
      <AudioErrorBoundary url={SOUNDS_CONFIG.ball.rollingRock.url as string}>
        <PositionalAudio
          ref={stoneRampSoundRef}
          url={SOUNDS_CONFIG.ball.rollingRock.url as string}
          distance={15}
        />
      </AudioErrorBoundary>
      {/* Son pour les rampes métalliques */}
      <AudioErrorBoundary url={SOUNDS_CONFIG.ball.rollingRamps.url as string}>
        <PositionalAudio
          ref={rampsSoundRef}
          url={SOUNDS_CONFIG.ball.rollingRamps.url as string}
          distance={15}
        />
      </AudioErrorBoundary>
      {/* Visualiseur de Raycast de Débug */}
      {/* @ts-ignore : Conflit de types connu entre React SVG et Three.js */}
      <line ref={debugLineRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="red"
          depthTest={false}
          transparent
          opacity={0.8}
        />
      </line>
    </group>
  );
}
