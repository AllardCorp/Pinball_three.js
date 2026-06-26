import { useEffect, useRef, useState } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";
import ObjectSound from "@/components/sounds/ObjectSound";
import BallAudio from "@/components/sounds/BallAudio";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";
import { WARRIOR_POWER_CONFIG } from "@/config/gameBalancingConfig";
import ParticleExplosion from "@/components/pinball/ParticleExplosion";
import { useInputStore } from "@/store/inputStore/useInputStore";
import { useGameDebug } from "@/config/useGameDebug";

type BallProps = {
  position: [number, number, number];
};

export default function Ball({ position }: BallProps) {
  const ballRef = useRef<RapierRigidBody>(null);

  const [launchCount, setLaunchCount] = useState(0);
  const [launchVolume, setLaunchVolume] = useState(1);

  const [isWarriorExploding, setIsWarriorExploding] = useState(false);
  const [explosionPos, setExplosionPos] = useState<[number, number, number]>([
    0, 0, 0,
  ]);

  const isPlaying = useGameStore((state) => state.isPlaying);
  const ballInLauncher = useGameStore((state) => state.ballInLauncher);

  const warriorImpulseTrigger = useGameStore(
    (state) => state.warriorImpulseTrigger,
  );

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
          `Tir lancé avec une force de ${forceMagnitude.toFixed(2)} !`,
        );
        ballRef.current.applyImpulse({ x: 0, y: 0, z: -forceMagnitude }, true);
        ballRef.current.wakeUp();

        const forceRatio = forceMagnitude / maxForce;

        const calculatedVolume = 0.2 + forceRatio * 0.8;
        setLaunchVolume(calculatedVolume);
        setLaunchCount((prev) => prev + 1);
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

  // Compétence du guerrier
  useEffect(() => {
    // On s'assure qu'on est en jeu, que la bille n'est pas dans le lanceur et que le pouvoir a été déclenché
    if (
      warriorImpulseTrigger > 0 &&
      ballRef.current &&
      isPlaying &&
      !ballInLauncher
    ) {
      ballRef.current.wakeUp(); // Réveille la bille pour la physique

      // Sauvegarde de la position actuelle de la bille pour l'effet visuel
      const currentPos = ballRef.current.translation();
      setExplosionPos([currentPos.x, currentPos.y, currentPos.z]);

      // On applique instantanément la force fixe définie dans la config
      ballRef.current.applyImpulse(WARRIOR_POWER_CONFIG.impulseForce, true);

      console.log("Impulsion du Guerrier appliquée !");

      // Effet visuel
      setIsWarriorExploding(true);
      setTimeout(() => {
        setIsWarriorExploding(false);
      }, 500);
    }
  }, [warriorImpulseTrigger, isPlaying, ballInLauncher]);

  const { mass, restitution, size } = useGameDebug();

  // SÉCURITÉ : Si la partie n'est pas lancée, la bille n'existe pas dans le monde 3D
  // On render tout de même le son pour qu'il soit préchargé au démarrage de l'app,
  // évitant ainsi un retour du loading screen au clic sur "Démarrer".
  if (!isPlaying) {
    return (
      <group position={position}>
        <ObjectSound
          {...SOUNDS_CONFIG.ball.launch}
          playTrigger={launchCount}
          volume={0}
        />
        <BallAudio
          ballRef={ballRef}
          size={size}
          isPlaying={isPlaying}
          ballInLauncher={ballInLauncher}
        />
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
      >
        <mesh>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial color="silver" metalness={1} roughness={0.1} />
        </mesh>

        <ObjectSound
          {...SOUNDS_CONFIG.ball.launch}
          playTrigger={launchCount}
          volume={launchVolume}
        />
      </RigidBody>

      <group position={explosionPos}>
        <ParticleExplosion
          count={80}
          color="#fffa00"
          isExploding={isWarriorExploding}
        />
      </group>

      <BallAudio
        ballRef={ballRef}
        size={size}
        isPlaying={isPlaying}
        ballInLauncher={ballInLauncher}
      />
    </>
  );
}
