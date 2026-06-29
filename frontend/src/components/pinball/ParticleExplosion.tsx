import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";

export default function ParticleExplosion({
  count = 150,
  color = "#00ffff",
  isExploding,
}: {
  count?: number;
  color?: string;
  isExploding: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const velocitiesRef = useRef<{ x: number; y: number; z: number }[]>([]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useEffect(() => {
    if (isExploding && pointsRef.current && materialRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < count; i++) {
        posArray[i * 3] = 0;
        posArray[i * 3 + 1] = 0;
        posArray[i * 3 + 2] = 0;

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = Math.random() * 15 + 5;

        velocitiesRef.current[i] = {
          x: speed * Math.sin(phi) * Math.cos(theta),
          y: speed * Math.sin(phi) * Math.sin(theta),
          z: speed * Math.cos(phi),
        };
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      materialRef.current.opacity = 1;
    }
  }, [isExploding, count]);

  useFrame((_, delta) => {
    if (!isExploding || !pointsRef.current || !materialRef.current) return;

    const posArray = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocitiesRef.current[i].x * delta;
      posArray[i * 3 + 1] += velocitiesRef.current[i].y * delta;
      posArray[i * 3 + 2] += velocitiesRef.current[i].z * delta;

      velocitiesRef.current[i].x *= 0.9;
      velocitiesRef.current[i].y *= 0.9;
      velocitiesRef.current[i].z *= 0.9;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    materialRef.current.opacity = Math.max(
      0,
      materialRef.current.opacity - delta * 1.5,
    );
  });

  return (
    // frustumCulled={false} : Force la compilation immédiate par la carte graphique
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.18}
        color={color}
        transparent
        // Au lieu d'être invisible, l'opacité est juste à 0 au repos
        opacity={isExploding ? 1 : 0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
