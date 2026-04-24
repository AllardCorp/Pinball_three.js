// const mqtt = useMqtt()
//
// useEffect(() => {
//   if (!mqtt) return
//
//   mqtt.subscribe("pinball/flipper")
//
//   mqtt.on("message", (topic, message) => {
//     if (topic === "pinball/flipper") {
//       // trigger animation rapier
//     }
//   })
// }, [mqtt])

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import Experience from "../experience/Experience";
import { Perf } from "r3f-perf";
import { Leva, useControls } from "leva";
import { Environment } from "@react-three/drei";

export default function Playfield() {
  const { perfVisible } = useControls({
    perfVisible: true,
  });
  const { rapierDebug } = useControls("rapier", {
    rapierDebug: true,
  });
  const { gravityX, gravityY, gravityZ } = useControls("Gravity Controls", {
    // Tu peux ajuster les valeurs 'min', 'max' et 'step' selon la taille de ton flipper !
    gravityX: { value: 0, min: -20, max: 20, step: 0.1 },
    gravityY: { value: -9.81, min: -100, max: 20, step: 0.1 }, // 80 - 60
    gravityZ: { value: 8, min: -20, max: 20, step: 0.1 }, // 20
  });
  return (
    <div className="w-screen h-screen">
      <Leva collapsed />
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
        <color attach="background" args={["skyblue"]} />
        {perfVisible && <Perf position="top-left" showGraph />}
        <Environment preset="forest" />
        {/* <Physics debug={rapierDebug} gravity={[0, -9.81, 8]}> */}
        <Physics debug={rapierDebug} gravity={[gravityX, gravityY, gravityZ]}>
          <Experience />
        </Physics>
      </Canvas>
    </div>
  );
}
