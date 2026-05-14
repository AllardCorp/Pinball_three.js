import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier"; // 👈 1. Import du type
import * as THREE from "three";

type FlipperProps = {
  colliderGeometry: THREE.BufferGeometry;
  visualGeometry: THREE.BufferGeometry;
  visualMaterial: THREE.Material;
  position: [number, number, number];
  rotation: [number, number, number];
  side: "left" | "right";
};

export default function Flipper({
  colliderGeometry,
  visualGeometry,
  visualMaterial,
  position,
  rotation,
  side,
}: FlipperProps) {
  const { upForce, downForce } = useControls("Vitesse des flippers", {
    upForce: { value: 55, min: 10, max: 80, step: 0.1 },
    downForce: { value: 35, min: 10, max: 60, step: 0.1 },
  });
  // 👈 2. On indique à TypeScript le type exact de la référence
  const flipperRef = useRef<RapierRigidBody>(null);
  const [isActive, setIsActive] = useState(false);
  const animProgress = useRef(0);

  const initialPosition = useMemo(
    () => new THREE.Vector3(...position),
    [position],
  );

  useEffect(() => {
    const key = side === "left" ? ["q", "a"] : ["d"];

    // 👈 Bonus TS : On remplace "any" par "KeyboardEvent"
    const onKeyDown = (e: KeyboardEvent) => {
      if (key.includes(e.key.toLowerCase())) setIsActive(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (key.includes(e.key.toLowerCase())) setIsActive(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [side]);

  // 👈 3. On remplace "state" par "_" pour indiquer qu'on ignore le premier paramètre
  useFrame((_, delta) => {
    if (!flipperRef.current) return;
    const speed = isActive ? upForce : downForce; // Vitesse de levée | Vitesse de descente du flipper
    const target = isActive ? 1 : 0;
    animProgress.current = THREE.MathUtils.lerp(
      animProgress.current,
      target,
      delta * speed,
    );

    const swingAngle = Math.PI / 3;
    const direction = side === "left" ? 1 : -1;
    const currentAngleY =
      rotation[1] + animProgress.current * swingAngle * direction;

    const euler = new THREE.Euler(
      rotation[0],
      currentAngleY,
      rotation[2],
      "XYZ",
    );
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    flipperRef.current.setNextKinematicRotation(quaternion);

    // On utilise la position initialisée plus haut
    flipperRef.current.setNextKinematicTranslation(initialPosition);
  });

  return (
    <RigidBody
      ref={flipperRef}
      type="kinematicPosition"
      ccd={true}
      colliders="hull"
      position={position} // Le RigidBody se place aux bonnes coordonnées
      restitution={0.2}
      friction={0.2}
      // Sécurité supplémentaire pour empêcher toute glissade physique
      enabledTranslations={[false, false, false]}
    >
      {/* 1. Le mesh de collision (invisible) */}
      <mesh geometry={colliderGeometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 2. Le mesh visuel ! (Remarque : pas de position ni de rotation ici !) */}
      <mesh geometry={visualGeometry} material={visualMaterial} />
    </RigidBody>
  );
}
