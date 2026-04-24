import { useEffect, useRef } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useGameStore } from "@/store/useGameStore"; // Adapte le chemin vers ton store

type BallProps = {
  position: [number, number, number];
};

export default function Ball({ position }: BallProps) {
  const ballRef = useRef<RapierRigidBody>(null);
  const chargeStartTime = useRef<number>(0);

  // 👇 1. On récupère les états de Zustand
  const { isPlaying, ballInLauncher } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 👇 2. SÉCURITÉ : On ne peut charger le tir QUE si la partie est en cours
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
      // 👇 3. SÉCURITÉ : Même vérification au relâchement
      if (
        e.code === "Space" &&
        chargeStartTime.current > 0 &&
        isPlaying &&
        ballInLauncher
      ) {
        const duration = performance.now() - chargeStartTime.current;
        chargeStartTime.current = 0;

        const maxForce = 70;
        const forceMagnitude = Math.min(duration * 0.05, maxForce);

        if (ballRef.current) {
          ballRef.current.applyImpulse(
            // Garde tes axes Z ou Y selon l'orientation de ton flipper
            { x: 0, y: 0, z: -forceMagnitude },
            true,
          );
          ballRef.current.wakeUp();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, ballInLauncher]); // 👈 N'oublie pas de mettre les variables Zustand dans le tableau de dépendances !

  useEffect(() => {
    // Si la partie est en cours ET qu'on nous dit que la bille est dans le lanceur
    if (isPlaying && ballInLauncher && ballRef.current) {
      // 1. On téléporte la bille à ses coordonnées de départ (position = prop du composant)
      ballRef.current.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true,
      );

      // 2. On "tue" toute son énergie cinétique pour ne pas qu'elle rebondisse bizarrement
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      console.log("Bille replacée dans le lanceur !");
    }
  }, [ballInLauncher, isPlaying, position]); // Ce code s'exécute dès que ces variables changent

  // On garde tes contrôles Leva (très pratique pour les tests)
  const { mass, restitution, size } = useControls("Ball Controls", {
    mass: { value: 3.5, min: 0.1, max: 20, step: 0.1 },
    restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
    size: { value: 0.6, min: 0.1, max: 5, step: 0.05 },
  });

  // 👇 SÉCURITÉ GLOBALE : Si la partie n'est pas lancée, la bille n'existe pas dans le monde 3D
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
    >
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="silver" metalness={1} roughness={0.1} />
      </mesh>
    </RigidBody>
  );
}
