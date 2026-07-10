import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls, folder } from "leva";

import vertexShader from "../../shaders/cannon-smoke-ring/vertex.glsl?raw";
import fragmentShader from "../../shaders/cannon-smoke-ring/fragment.glsl?raw";

// Duree (en secondes) pendant laquelle l'anneau reste visible apres un tir
const RING_DURATION = 1.5;

// playTrigger s'incremente a chaque tir du canon (voir cannonShotsCount dans le store)
export default function SmokeRing({
  playTrigger = 0,
}: {
  playTrigger?: number;
}) {
  // Temps ecoule depuis le dernier tir. Reste fini (contrairement a Infinity) pour eviter
  // que uElapsed ne produise un NaN dans le calcul du rayon de l'anneau cote shader.
  const elapsedSinceShotRef = useRef(RING_DURATION);
  // Evite de jouer l'effet des le montage (meme pattern que ObjectSound / SmokeEffect)
  const isMounted = useRef(false);

  // Regroupe avec SmokeEffect sous le meme dossier Leva pour eviter un debug a rallonge
  const { position, rotation, scale, forceVisible } = useControls(
    "Smoke Effect",
    {
      Ring: folder(
        {
          position: { value: [2.3, 0.9, -18.4], step: 0.1 },
          rotation: { value: [-0.7, -0.7, 0], step: 0.05 },
          scale: { value: 1.3, min: 0.1, max: 10, step: 0.1 },
          forceVisible: false,
        },
        { collapsed: true },
      ),
    },
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        {
          uElapsed: { value: RING_DURATION },
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

  // (Re)demarre le burst de l'anneau a chaque tir du canon, sauf au montage initial
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    elapsedSinceShotRef.current = 0;
  }, [playTrigger]);

  useFrame((_, delta) => {
    elapsedSinceShotRef.current += delta;

    // Debug : rejoue la boucle en continu, car forcer juste l'opacite ne suffit pas
    // (le rayon de l'anneau depend aussi du temps ecoule et finirait par sortir du cercle)
    if (forceVisible && elapsedSinceShotRef.current >= RING_DURATION) {
      elapsedSinceShotRef.current = 0;
    }

    material.uniforms.uElapsed.value = elapsedSinceShotRef.current;
    material.uniforms.uOpacity.value = Math.max(
      0,
      1 - elapsedSinceShotRef.current / RING_DURATION,
    );
  });

  return (
    <mesh
      material={material}
      position={position as [number, number, number]}
      rotation={rotation as [number, number, number]}
      scale={[scale, scale, 1]}
    >
      <circleGeometry args={[1, 32]} />
    </mesh>
  );
}
