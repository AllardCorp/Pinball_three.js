import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls, folder } from "leva";

import vertexShader from "../../shaders/cannon-smoke/vertex.glsl?raw";
import fragmentShader from "../../shaders/cannon-smoke/fragment.glsl?raw";

// NOUVEAU : durée (en secondes) pendant laquelle la fumée reste visible après un tir
const SMOKE_DURATION = 5;

export default function SmokeEffect({
  playTrigger = 0,
}: {
  playTrigger?: number;
}) {
  const elapsedSinceShotRef = useRef(Infinity);
  const isMounted = useRef(false);
  const { position, rotation, scaleWidth, scaleHeight, forceVisible } =
    useControls("Smoke Effect", {
      Trail: folder(
        {
          position: { value: [2.5, 1.0, -18.5], step: 0.1 },
          rotation: { value: [0, 0.8, 1.0], step: 0.05 },
          scaleWidth: { value: 1.5, min: 0.1, max: 10, step: 0.1 },
          scaleHeight: { value: 5.0, min: 0.1, max: 10, step: 0.1 },
          forceVisible: false,
        },
        { collapsed: true },
      ),
    });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#cccccc") },
        },
      ]),
      vertexShader,
      fragmentShader,
      fog: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    elapsedSinceShotRef.current = 0;
  }, [playTrigger]);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;

    elapsedSinceShotRef.current += delta;
    material.uniforms.uOpacity.value = forceVisible
      ? 1
      : Math.max(0, 1 - elapsedSinceShotRef.current / SMOKE_DURATION);
  });

  return (
    <mesh
      material={material}
      position={position as [number, number, number]}
      rotation={rotation as [number, number, number]}
      scale={[scaleWidth, scaleHeight, 1]}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
