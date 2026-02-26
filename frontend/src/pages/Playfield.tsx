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
import Scene from "../experience/Scene";
import { Perf } from "r3f-perf";

export default function Playfield() {
  return (
    <div className="w-screen h-screen">
      <Canvas camera={{ position: [0, 8, 15], fov: 50 }}>
        <Perf position="top-left" />
        <Physics gravity={[0, -9.81, 0]}>
          <Scene />
        </Physics>
      </Canvas>
    </div>
  );
}
