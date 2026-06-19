import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";
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
    near,
    far,
    filmGauge,
    filmOffset,
  } = useControls("Camera & Controls", {
    isOrthographic: false,
    orbitControls: false,
    useLookAt: true,

    // Position de la caméra
    camX: { value: -0.62, min: -400, max: 400, step: 0.1 },
    camY: { value: 62.6, min: -400, max: 400, step: 0.1 },
    camZ: { value: 30.93, min: -400, max: 400, step: 0.1 },

    // Cible (Mets targetX à 0 pour centrer parfaitement si le flipper est au centre)
    targetX: { value: 0, min: -400, max: 400, step: 0.1 },
    targetY: { value: -3.76, min: -400, max: 400, step: 0.1 },
    targetZ: { value: 2.55, min: -400, max: 400, step: 0.1 },

    // Rotation
    rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },

    // Paramètres spécifiques Perspective
    fov: { value: 47.5, min: 10, max: 120, step: 1 },
    filmGauge: { value: 35, min: 1, max: 100, step: 1 },
    filmOffset: { value: 0, min: -400, max: 400, step: 0.1 },

    // Paramètres partagés
    near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
    far: { value: 1000, min: 10, max: 5000, step: 1 },
  });

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);

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
        near={near}
        far={far}
        filmGauge={filmGauge}
        filmOffset={filmOffset}
      />

      {orbitControls && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[targetX, targetY, targetZ]}
          onEnd={() => {
            console.log("Position :", cameraRef.current?.position);
            console.log("Target :", controlsRef.current?.target);
          }}
        />
      )}

      {/* Le Fallback HTML unique et en mode fullscreen */}
      {/* <Suspense */}
      {/*   fallback={ */}
      {/*     <Html fullscreen> */}
      {/*       <main className="bg-indigo-950 w-screen h-screen flex items-center justify-center"> */}
      {/*         <span className="text-orange-300 font-semibold text-4xl"> */}
      {/*           Loading... */}
      {/*         </span> */}
      {/*       </main> */}
      {/*     </Html> */}
      {/*   } */}
      {/* > */}
      {/*   <PinballMVPBase /> */}
      {/* </Suspense> */}
      <PinballMVPBase />
    </>
  );
}
