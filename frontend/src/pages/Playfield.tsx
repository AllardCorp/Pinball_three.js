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
import Scene from "../experience/Experience";
import { Perf } from "r3f-perf";
import { Leva, useControls } from "leva";

export default function Playfield() {
  const { rapierDebug } = useControls("rapier", {
    rapierDebug: false,
  });

  return (
    <div className="w-screen h-screen">
      <Leva collapsed />
      <Canvas camera={{ position: [0, 8, 15], fov: 50 }}>
        <Perf position="top-left" showGraph />
        <Physics debug={rapierDebug} gravity={[0, -9.81, 0]}>
          <Scene />
        </Physics>
      </Canvas>
    </div>
  );
}
