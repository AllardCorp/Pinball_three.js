import { useEffect, useRef, useState } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useGameStore } from "@/store/useGameStore";
import ObjectSound from "./ObjectSound";
import BallAudio from "./BallAudio";

type BallProps = {
  position: [number, number, number];
};

export default function Ball({ position }: BallProps) {
  const ballRef = useRef<RapierRigidBody>(null);
  const chargeStartTime = useRef<number>(0);

  const [launchCount, setLaunchCount] = useState(0);
  const [launchVolume, setLaunchVolume] = useState(1);
  const { isPlaying, ballInLauncher } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 2. SÉCURITÉ : On ne peut charger le tir QUE si la partie est en cours
      // ET que la bille est bien dans la zone de lancement
      if (
        e.code === "Space" &&
        chargeStartTime.current === 0 &&
        isPlaying &&
        ballInLauncher
      ) {
        chargeStartTime.current = performance.now();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 3. SÉCURITÉ : Même vérification au relâchement
      if (
        e.code === "Space" &&
        chargeStartTime.current > 0 &&
        isPlaying &&
        ballInLauncher
      ) {
        const duration = performance.now() - chargeStartTime.current;
        chargeStartTime.current = 0;

        const maxForce = 120;
        const forceMagnitude = Math.min(duration * 0.1, maxForce);

        if (ballRef.current) {
          console.log(
            `Tir lancé avec une force de ${forceMagnitude.toFixed(2)} !`,
          );
          ballRef.current.applyImpulse(
            { x: 0, y: 0, z: -forceMagnitude },
            true,
          );
          ballRef.current.wakeUp();

          const forceRatio = forceMagnitude / maxForce;

          const calculatedVolume = 0.2 + (forceRatio * 0.8);
          setLaunchVolume(calculatedVolume);
          setLaunchCount((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, ballInLauncher]);
  useEffect(() => {
    // Si la partie est en cours ET qu'on nous dit que la bille est dans le lanceur
    if (isPlaying && ballInLauncher && ballRef.current) {
      // 1. Téléportation de la bille à la position de lancement (et réveil au cas où elle serait endormie)
      ballRef.current.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true,
      );

      // 2. On "tue" toute son énergie cinétique pour ne pas qu'elle rebondisse bizarrement
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      console.log("Bille replacée dans le lanceur !");
    }
  }, [ballInLauncher, isPlaying, position]);

  // const { mass, restitution, size, linearDamping, angularDamping } = ❓
  const { mass, restitution, size } = useControls("Ball Controls", {
    mass: { value: 3.5, min: 0.1, max: 20, step: 0.1 },
    restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
    size: { value: 0.6, min: 0.1, max: 5, step: 0.05 },
    linearDamping: { value: 0.1, min: 0, max: 1, step: 0.01 },
    angularDamping: { value: 0.1, min: 0, max: 1, step: 0.01 },
  });



  // SÉCURITÉ : Si la partie n'est pas lancée, la bille n'existe pas dans le monde 3D
  // On render tout de même le son pour qu'il soit préchargé au démarrage de l'app,
  // évitant ainsi un retour du loading screen au clic sur "Démarrer".
  if (!isPlaying) {
    return (
      <group position={position}>
        <ObjectSound
          url="/sounds/plunger/plungerlaunch.ogg"
          playTrigger={launchCount}
          volume={0}
        />
        <BallAudio ballRef={ballRef} size={size} isPlaying={isPlaying} ballInLauncher={ballInLauncher} />
      </group>
    );
  }

  return (
    <>
      <RigidBody
        name="ball"
        ref={ballRef}
        ccd={true}
        position={position}
        colliders="ball"
        restitution={restitution}
        mass={mass}
      //      linearDamping={linearDamping}
      //     angularDamping={angularDamping}
      >
        <mesh>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial color="silver" metalness={1} roughness={0.1} />
        </mesh>

        <ObjectSound
          url="/sounds/plunger/plungerlaunch.ogg"
          playTrigger={launchCount}
          volume={launchVolume}
        />

      </RigidBody>

      <BallAudio ballRef={ballRef} size={size} isPlaying={isPlaying} ballInLauncher={ballInLauncher} />
    </>
  );
}
