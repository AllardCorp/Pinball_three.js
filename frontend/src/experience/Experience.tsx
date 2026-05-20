import { OrbitControls, useHelper } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

import PinballMVPBase from "../components/models/PinballMVP_Base";

export default function Experience() {
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

      <Suspense fallback={null}>
        <PinballMVPBase />
      </Suspense>
    </>
  );
}
