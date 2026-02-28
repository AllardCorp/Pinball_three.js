import { RigidBody } from "@react-three/rapier";
import { OrbitControls, useHelper } from "@react-three/drei";
import { useControls } from "leva";
import { useRef } from "react";
import * as THREE from "three";

export default function Experience() {
  const { groundColor } = useControls("ground", {
    groundColor: "greenyellow",
  });
  const { ballColor, ballPosition } = useControls("ball", {
    ballColor: "crimson",
    ballPosition: { value: [0, 5, 0], step: 0.5, min: -10, max: 10 },
  });

  const directionalLightRef = useRef<THREE.DirectionalLight>(null!);
  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, "red");
  return (
    <>
      <OrbitControls />

      <ambientLight />
      <directionalLight
        castShadow
        ref={directionalLightRef}
        position={[2, 5, 2]}
      />

      {/* Sol */}
      <RigidBody type="fixed" restitution={1}>
        <mesh receiveShadow>
          <boxGeometry args={[10, 0.5, 10]} />
          <meshStandardMaterial color={groundColor} />
        </mesh>
      </RigidBody>

      {/* Bille */}
      <RigidBody colliders="ball" restitution={1}>
        <mesh castShadow position={ballPosition}>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color={ballColor} />
        </mesh>
      </RigidBody>
    </>
  );
}
