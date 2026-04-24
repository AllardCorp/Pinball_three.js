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
import { Suspense } from "react";
import { useControls, button } from "leva";
import PinballMVPBase from "@/components/models/PinballMVP_Base";
import Ball from "@/components/Ball"; // Adapte le chemin
import { useGameStore } from "@/store/useGameStore"; // Adapte le chemin

export default function Experience() {
  // On récupère juste la fonction startGame (temporairement pour nos tests Leva)
  const startGame = useGameStore((state) => state.startGame);

  // On garde Leva pour ajuster la position de départ
  const { startX, startY, startZ } = useControls("Ball Position", {
    startX: { value: 12.75, min: -20, max: 20, step: 0.1 },
    startY: { value: -2.3, min: -20, max: 20, step: 0.1 },
    startZ: { value: 30.46, min: -20, max: 80, step: 0.1 },
  });

  // 👇 BOUTON DE TEST TEMPORAIRE : Pour démarrer la partie depuis l'écran 3D sans interface HTML
  useControls("Game Controls", {
    "Démarrer Partie": button(() => startGame()),
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

        {/* Le composant Ball se gère tout seul grâce à Zustand (il s'affiche que si isPlaying === true) */}
        <Ball position={[startX, startY, startZ]} />
      </Suspense>
    </>
  );
}
