// Dans Flipper.tsx (ou là où se trouve ta fonction Flipper)
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// 👇 On ajoute visualGeometry et visualMaterial
export default function Flipper({
  colliderGeometry,
  visualGeometry,
  visualMaterial,
  position,
  rotation,
  side,
}) {
  const flipperRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const animProgress = useRef(0);

  useEffect(() => {
    const key = side === "left" ? ["q", "a"] : ["d"];
    const onKeyDown = (e) => {
      if (key.includes(e.key.toLowerCase())) setIsActive(true);
    };
    const onKeyUp = (e) => {
      if (key.includes(e.key.toLowerCase())) setIsActive(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [side]);

  useFrame((state, delta) => {
    if (!flipperRef.current) return;
    const speed = isActive ? 25 : 15;
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
  });

  return (
    <RigidBody
      ref={flipperRef}
      type="kinematicPosition"
      ccd={true}
      colliders="hull"
      position={position} // Le RigidBody se place aux bonnes coordonnées
      restitution={0.8}
      friction={0.2}
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
