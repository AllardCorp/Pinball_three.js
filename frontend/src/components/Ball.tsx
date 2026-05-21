import { useEffect, useRef } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useGameStore } from "@/store/useGameStore"; // Adapte le chemin vers ton store
import { useInputStore } from "@/store/useInputStore";
type BallProps = {
  position: [number, number, number];
};

export default function Ball({ position }: BallProps) {
  const ballRef = useRef<RapierRigidBody>(null);

  const { isPlaying, ballInLauncher } = useGameStore();
  // Écoute des contrôles de lancement provenant de MQTT ou du clavier
  const launchBall = useInputStore((state) => state.buttons.launch_ball);
  const plungerForce = useInputStore((state) => state.analog.plunger);

  // Référence pour détecter la transition de launch_ball (front montant: false -> true)
  const prevLaunchBall = useRef(false);

  useEffect(() => {
    if (launchBall && !prevLaunchBall.current && isPlaying && ballInLauncher) {
      const maxForce = 120;
      // Calcul de la force en fonction de la jauge MQTT plungerForce (0.0 à 1.0)
      const forceMagnitude = plungerForce > 0 ? plungerForce * maxForce : 30; // Force par défaut si lancement immédiat

      if (ballRef.current) {
        console.log(
          `🚀 Bille lancée via MQTT ! Force appliquée: ${forceMagnitude.toFixed(2)}`,
        );
        ballRef.current.applyImpulse(
          { x: 0, y: 0, z: -forceMagnitude },
          true,
        );
        ballRef.current.wakeUp();
      }
    }
    prevLaunchBall.current = launchBall;
  }, [launchBall, plungerForce, isPlaying, ballInLauncher]);
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
  if (!isPlaying) return null;

  return (
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
    </RigidBody>
  );
}
