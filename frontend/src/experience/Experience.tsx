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
import PinballMVPBase from "@/components/models/PinballMVP_Base";

export default function Experience() {
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
      </Suspense>
    </>
  );
}
