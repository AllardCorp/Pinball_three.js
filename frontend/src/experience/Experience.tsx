import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameDebug } from "@/config/useGameDebug";
import * as THREE from "three";
import PinballBase from "@/components/models/Pinball";

export default function Experience() {
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
  } = useGameDebug();

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

      <PinballBase />
    </>
  );
}
