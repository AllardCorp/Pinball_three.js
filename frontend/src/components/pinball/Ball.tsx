import { useEffect, useRef, useState, useMemo } from "react";
import { RigidBody, type RapierRigidBody, useRapier } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import ObjectSound from "@/components/sounds/ObjectSound";
import BallAudio from "@/components/sounds/BallAudio";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";
import { WARRIOR_POWER_CONFIG } from "@/config/gameBalancingConfig";
import ParticleExplosion from "@/components/pinball/ParticleExplosion";
import { useInputStore } from "@/store/inputStore/useInputStore";
import { useGameDebug } from "@/config/useGameDebug";
import { useControls, folder, button } from "leva";
import { useRampScoring } from "@/hooks/useRampScoring";

type BallProps = {
  id?: string;
  origin?: "launcher" | "cannon";
  position: [number, number, number];
};

export default function Ball({
  id = "legacy_launcher_ball",
  origin = "launcher",
  position,
}: BallProps) {
  const ballRef = useRef<RapierRigidBody>(null);
  const currentSurfaceRef = useRef<string>("RIEN (Vide/Air)");
  const lastHitColliderRef = useRef<string | null>(null);

  const { rapier, world, rigidBodyStates, colliderStates } = useRapier();

  const [launchCount, setLaunchCount] = useState(0);
  const [launchVolume, setLaunchVolume] = useState(1);

  const [isWarriorExploding, setIsWarriorExploding] = useState(false);
  const [explosionPos, setExplosionPos] = useState<[number, number, number]>([
    0, 0, 0,
  ]);

  const isPlaying = useGameStore((state) => state.isPlaying);
  const ballInLauncher = useGameStore((state) => state.ballInLauncher);
  const setBallInLauncher = useGameStore((state) => state.setBallInLauncher);
  const warriorImpulseTrigger = useGameStore(
    (state) => state.warriorImpulseTrigger,
  );

  const launchBall = useInputStore((state) => state.buttons.front_white);
  const prevLaunchBall = useRef(false);

  const { mass, restitution, size } = useGameDebug();

  // OUTIL DE DEBUG : FANTÔME DU CANON
  // Pas de la config leva global car utile pour le debug et pas pour le gameplay
  const { debugCannon, cx, cy, cz, cDirX, cDirY, cDirZ, cForce } = useControls(
    "Canon",
    {
      "(Canon)": folder({
        debugCannon: { value: false, label: "Afficher Fantôme" },
        cx: { value: 3.1, step: 0.1, label: "Pos X" },
        cy: { value: 0.3, step: 0.1, label: "Pos Y" },
        cz: { value: -19.2, step: 0.1, label: "Pos Z" },
        cDirX: { value: -1, min: -1, max: 1, step: 0.1, label: "Dir X" },
        cDirY: { value: 0.8, min: -1, max: 1, step: 0.1, label: "Dir Y" },
        cDirZ: { value: 1, min: -1, max: 1, step: 0.1, label: "Dir Z" },
        cForce: { value: 30, min: 0, max: 200, step: 1, label: "Puissance" },
        "Log Position": button((get) => {
          console.log(`\n--- Coordonnées du Canon ---`);
          console.log(
            `const CANNON_POSITION: [number, number, number] = [${get("cx").toFixed(2)}, ${get("cy").toFixed(2)}, ${get("cz").toFixed(2)}];`,
          );
          console.log(
            `Direction: [${get("cDirX")}, ${get("cDirY")}, ${get("cDirZ")}] @ Force ${get("cForce")}`,
          );
        }),
      }),
    },
    { collapsed: true },
  );

  const startPos = useMemo<[number, number, number]>(() => {
    return origin === "cannon" ? [cx, cy, cz] : position;
  }, [origin, cx, cy, cz, position[0], position[1], position[2]]);

  // Flèche d'éjection du cannon pour le debug
  const cannonGhost = debugCannon ? (
    <group position={[cx, cy, cz]}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color="#00ffff" wireframe={true} />
      </mesh>
      <arrowHelper
        args={[
          new THREE.Vector3(cDirX, cDirY, cDirZ).normalize(),
          new THREE.Vector3(0, 0, 0),
          2,
          0xff00ff,
          0.5,
          0.5,
        ]}
      />
    </group>
  ) : null;

  // LOGIQUE DU CANON (NÉCROMANCIEN)
  useEffect(() => {
    if (origin === "cannon" && ballRef.current && isPlaying) {
      const timer = setTimeout(() => {
        if (ballRef.current) {
          ballRef.current.wakeUp();
          ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

          // Calcul de l'impulsion avec la direction et la force du canon
          const impulse = {
            x: cDirX * cForce,
            y: cDirY * cForce,
            z: cDirZ * cForce,
          };

          ballRef.current.applyImpulse(impulse, true);
          console.log(
            `💀 Bille [${id}] ressuscitée et éjectée depuis le canon !`,
          );
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [origin, id, isPlaying, cDirX, cDirY, cDirZ, cForce]);

  // LOGIQUE DU LANCEUR CLASSIQUE
  useEffect(() => {
    if (
      origin === "launcher" &&
      launchBall &&
      !prevLaunchBall.current &&
      isPlaying &&
      ballInLauncher
    ) {
      const currentPlungerForce = useInputStore.getState().analog.plunger;
      const maxForce = 120;

      const forceMagnitude =
        currentPlungerForce > 0 ? currentPlungerForce * maxForce : 30;
      if (ballRef.current) {
        ballRef.current.applyImpulse({ x: 0, y: 0, z: -forceMagnitude }, true);
        ballRef.current.wakeUp();

        const forceRatio = forceMagnitude / maxForce;
        setLaunchVolume(0.2 + forceRatio * 0.8);
        setLaunchCount((prev) => prev + 1);
      }
    }
    prevLaunchBall.current = launchBall;
  }, [launchBall, isPlaying, ballInLauncher, origin, setBallInLauncher]);

  // LOGIQUE DE REPOSITIONNEMENT
  const hasBeenReset = useRef(false);

  useEffect(() => {
    if (
      origin === "launcher" &&
      isPlaying &&
      ballInLauncher &&
      ballRef.current
    ) {
      if (!hasBeenReset.current) {
        ballRef.current.setTranslation(
          { x: startPos[0], y: startPos[1], z: startPos[2] },
          true,
        );
        ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

        hasBeenReset.current = true;
      }
    } else {
      hasBeenReset.current = false;
    }
  }, [ballInLauncher, isPlaying, startPos, origin]);

  // COMPÉTENCE DU GUERRIER
  useEffect(() => {
    if (
      warriorImpulseTrigger > 0 &&
      ballRef.current &&
      isPlaying &&
      (origin === "cannon" || !ballInLauncher)
    ) {
      ballRef.current.wakeUp();
      const currentPos = ballRef.current.translation();
      setExplosionPos([currentPos.x, currentPos.y, currentPos.z]);

      ballRef.current.applyImpulse(WARRIOR_POWER_CONFIG.impulseForce, true);

      setIsWarriorExploding(true);
      setTimeout(() => setIsWarriorExploding(false), 500);
    }
  }, [warriorImpulseTrigger, isPlaying, ballInLauncher, origin]);

  useFrame(() => {
    if (!isPlaying || !ballRef.current) return;

    const body = ballRef.current;
    const pos = body.translation();

    // --- RAYCAST DESCENTE ---
    const rapierRay = new rapier.Ray(
      { x: pos.x, y: pos.y, z: pos.z },
      { x: 0, y: -1, z: 0 },
    );
    const hit = world.castRay(
      rapierRay,
      size + 0.6,
      true,
      undefined,
      undefined,
      undefined,
      body,
    );

    let hitName = "RIEN (Vide/Air)";

    if (hit) {
      const parentBody = hit.collider.parent();
      const rbState = (rigidBodyStates as any)?.get(parentBody?.handle);
      const bodyName = rbState?.object?.name || "";
      const colState = (colliderStates as any)?.get(hit.collider.handle);
      const meshName = colState?.object?.name || "";

      hitName = bodyName || meshName || `Collider_${hit.collider.handle}`;
    }

    currentSurfaceRef.current = hitName;

    if (hitName !== lastHitColliderRef.current) {
      const isOnPlayfield = hitName === "coll_playfield_collision_left_hole";
      const isOnRockRamp = hitName === "stone_ramp" || hitName === "coll_faquir";
      const isOnRamps = hitName === "coll_ramps";
      
      const logColor =
        isOnPlayfield || isOnRockRamp || isOnRamps
          ? "color: #00ff00; font-weight: bold;"
          : "color: #ff9900; font-weight: bold;";
      console.log(
        `%c[Raycast Ball Hit] ${hitName}`,
        logColor,
        hit
          ? { distance: (hit as any).toi, collider: hit.collider }
          : "Air/Vide",
      );
      lastHitColliderRef.current = hitName;
    }
  });

  // Appelle le Hook customisé pour la gestion du score
  useRampScoring(currentSurfaceRef, isPlaying);

  // --- RENDU AVANT LE LANCEMENT DE LA PARTIE ---
  if (!isPlaying) {
    return (
      <>
        {cannonGhost}
        <group position={startPos}>
          <ObjectSound
            {...SOUNDS_CONFIG.ball.launch}
            playTrigger={launchCount}
            volume={0}
          />
          <BallAudio
            ballRef={ballRef}
            size={size}
            isPlaying={isPlaying}
            currentSurfaceRef={currentSurfaceRef}
          />
        </group>
      </>
    );
  }

  // --- RENDU EN JEU ---
  return (
    <>
      {cannonGhost}

      <RigidBody
        name="ball"
        ref={ballRef}
        ccd={true}
        position={startPos}
        colliders="ball"
        restitution={restitution}
        mass={mass}
        userData={{ id }}
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
        currentSurfaceRef={currentSurfaceRef}
      />
    </>
  );
}
