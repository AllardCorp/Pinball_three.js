import { OrbitControls, Html, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import PinballMVPBase from "@/components/models/PinballMVP_Base";

export default function Experience() {
  // LEVA
  const {
    orbitControls,
    useLookAt,
    camX,
    camY,
    camZ,
    targetX,
    targetY,
    targetZ,
    rotX,
    rotY,
    rotZ,
    fov,
  } = useControls("Camera & Controls", {
    orbitControls: false,
    useLookAt: true,

    // Position de la caméra
    camX: { value: 0, min: -50, max: 50, step: 0.1 },
    camY: { value: 56.7, min: -50, max: 100, step: 0.1 },
    camZ: { value: 29.5, min: -50, max: 100, step: 0.1 },

    // Cible
    targetX: { value: 0.5, min: -50, max: 50, step: 0.1 },
    targetY: { value: -5.0, min: -50, max: 50, step: 0.1 },
    targetZ: { value: 4.7, min: -50, max: 50, step: 0.1 },

    // Rotation
    rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },

    fov: { value: 45, min: 10, max: 120, step: 1 },
  });

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // GESTION DE LA CAMÉRA
  useFrame((state) => {
    if (!orbitControls) {
      state.camera.position.set(camX, camY, camZ);

      if (useLookAt) {
        state.camera.lookAt(targetX, targetY, targetZ);
      } else {
        state.camera.rotation.set(rotX, rotY, rotZ);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        ref={cameraRef}
        position={[camX, camY, camZ]}
        fov={fov}
      />

      {orbitControls && (
        <OrbitControls makeDefault target={[targetX, targetY, targetZ]} />
      )}

      <Suspense
        fallback={
          <Html center>
            <main className="bg-indigo-950 min-w-screen min-h-screen flex items-center justify-center">
              <span className="text-orange-300 font-semibold text-4xl">
                Loading...
              </span>
            </main>
          </Html>
        }
      >
        <PinballMVPBase />
      </Suspense>
    </>
  );
}
