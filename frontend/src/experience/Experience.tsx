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
import PinballMVP from "@/components/models/PinballMVPResized";

// --- COMPOSANT DE LA BILLE ---
function PinballBall() {
  const ballRef = useRef<RapierRigidBody>(null);
  const chargeStartTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si on appuie sur Espace et qu'on ne chargeait pas déjà
      if (e.code === "Space" && chargeStartTime.current === 0) {
        chargeStartTime.current = performance.now();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && chargeStartTime.current > 0) {
        // Calcule le temps passé en millisecondes
        const duration = performance.now() - chargeStartTime.current;
        chargeStartTime.current = 0; // Réinitialise

        // Calcule la force (Ajuste le multiplicateur selon le poids de ta bille)
        // Math.min évite que le joueur ne charge à l'infini et casse la physique
        const maxForce = 50;
        const forceMagnitude = Math.min(duration * 0.05, maxForce);

        // Applique l'impulsion !
        // ⚠️ ATTENTION : Change l'axe (x, y ou z) selon l'orientation de ton modèle Blender
        if (ballRef.current) {
          ballRef.current.applyImpulse(
            { x: 0, y: 0, z: -forceMagnitude },
            true,
          );

          // Optionnel : "Réveille" la bille si Rapier l'avait mise en veille
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

  return (
    // position initiale = là où se trouve ton lance-bille dans Blender
    <RigidBody
      ref={ballRef}
      ccd={true}
      position={[4.5, 1, 6]}
      colliders="ball"
      restitution={0.5}
      mass={1}
    >
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} /> {/* Ajuste la taille (0.5) */}
        <meshStandardMaterial color="silver" metalness={1} roughness={0.1} />
      </mesh>
    </RigidBody>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function Experience() {
  // État pour savoir si la bille est dans le jeu ou non
  const [ballSpawned, setBallSpawned] = useState(false);

  // Configuration du GUI Leva
  useControls("Flipper Controls", {
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
        <PinballMVP />

        {/* On affiche la bille uniquement si on a cliqué sur le bouton du GUI */}
        {ballSpawned && <PinballBall />}
      </Suspense>
    </>
  );
}
