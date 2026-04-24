// import { OrbitControls, Html } from "@react-three/drei";
// import { Suspense } from "react";
// import PinballMVP from "@/components/models/PinballMVPResized";
//
// export default function Experience() {
//   return (
//     <>
//       <OrbitControls />
//       <Suspense
//         fallback={
//           <Html center>
//             <main className="bg-indigo-950 min-w-screen min-h-screen flex items-center justify-center">
//               <span className="text-orange-300 font-semibold text-4xl">
//                 Loading...
//               </span>
//             </main>
//           </Html>
//         }
//       >
//         <PinballMVP />
//       </Suspense>
//     </>
//   );
// }

import { OrbitControls, Html } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useControls, button } from "leva";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import PinballMVPBase from "@/components/models/PinballMVP_Base";

// --- COMPOSANT DE LA BILLE ---
// 1. On indique que le composant accepte une "prop" position
function PinballBall({ position }: { position: [number, number, number] }) {
  const ballRef = useRef<RapierRigidBody>(null);
  const chargeStartTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && chargeStartTime.current === 0) {
        chargeStartTime.current = performance.now();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && chargeStartTime.current > 0) {
        const duration = performance.now() - chargeStartTime.current;
        chargeStartTime.current = 0;

        const maxForce = 70;
        const forceMagnitude = Math.min(duration * 0.05, maxForce);

        if (ballRef.current) {
          ballRef.current.applyImpulse(
            { x: 0, y: 0, z: -forceMagnitude },
            true,
          );
          ballRef.current.wakeUp();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  const { mass, restitution, size } = useControls("Ball Controls", {
    // Tu peux ajuster les valeurs 'min', 'max' et 'step' selon la taille de ton flipper !
    mass: { value: 3.5, min: -20, max: 20, step: 0.1 },
    restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
    size: { value: 0.6, min: 0.1, max: 5, step: 0.05 },
  });
  return (
    <RigidBody
      ref={ballRef}
      ccd={true}
      position={position}
      colliders="ball"
      restitution={restitution}
      mass={mass}
    >
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="silver" metalness={1} roughness={0.1} />
      </mesh>
    </RigidBody>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function Experience() {
  const [ballSpawned, setBallSpawned] = useState(false);

  // 3. On ajoute les coordonnées de départ au GUI Leva
  // On récupère directement startX, startY et startZ de l'objet renvoyé par useControls
  const { startX, startY, startZ } = useControls("Ball Controls", {
    // Tu peux ajuster les valeurs 'min', 'max' et 'step' selon la taille de ton flipper !
    startX: { value: 4, min: -20, max: 20, step: 0.1 },
    startY: { value: 1, min: -20, max: 20, step: 0.1 },
    startZ: { value: 6, min: -20, max: 80, step: 0.1 },
    "Créer Bille": button(() => setBallSpawned(true)),
    "Supprimer Bille": button(() => setBallSpawned(false)),
  });

  return (
    <>
      <OrbitControls />
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

        {/* 4. On passe les variables du GUI au composant PinballBall sous forme de tableau [x, y, z] */}
        {ballSpawned && <PinballBall position={[startX, startY, startZ]} />}
      </Suspense>
    </>
  );
}
