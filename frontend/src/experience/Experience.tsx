import {
  OrbitControls,
  Html,
  PerspectiveCamera,
  OrthographicCamera,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import PinballMVPBase from "@/components/models/PinballMVP_Base";

export default function Experience() {
  // LEVA
  const {
    isOrthographic, // <-- Nouveau : Toggle entre les deux caméras
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
    orthoZoom, // <-- Nouveau : Zoom spécifique à la caméra orthographique
    near,
    far,
    filmGauge,
    filmOffset,
    aspectRatio,
  } = useControls("Camera & Controls", {
    isOrthographic: false,
    orbitControls: false,
    useLookAt: true,

    // Position de la caméra
    camX: { value: 0.2, min: -50, max: 50, step: 0.1 },
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

    // Paramètres spécifiques Perspective
    fov: { value: 45, min: 10, max: 120, step: 1 },
    filmGauge: { value: 35, min: 1, max: 100, step: 1 },
    filmOffset: { value: 0, min: -50, max: 50, step: 0.1 },
    aspectRatio: { value: 1.5, min: 0.1, max: 5, step: 0.01 },

    // Paramètres spécifiques Orthographique
    orthoZoom: { value: 50, min: 1, max: 300, step: 1 },

    // Paramètres partagés
    near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
    far: { value: 1000, min: 10, max: 5000, step: 1 },
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
      {/* Rendu conditionnel des caméras */}
      {isOrthographic ? (
        <OrthographicCamera
          makeDefault
          position={[camX, camY, camZ]}
          zoom={orthoZoom}
          near={near}
          far={far}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          ref={cameraRef}
          position={[camX, camY, camZ]}
          fov={fov}
          near={near}
          far={far}
          filmGauge={filmGauge}
          filmOffset={filmOffset}
          aspect={aspectRatio}
        />
      )}

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
