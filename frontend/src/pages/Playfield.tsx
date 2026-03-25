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

  return (
    <div className="w-screen h-screen">
      <Leva collapsed />
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
        <color attach="background" args={["skyblue"]} />
        {perfVisible && <Perf position="top-left" showGraph />}
        <Environment preset="city" />
        <Physics debug={rapierDebug} gravity={[0, -9.81, 8]}>
          <Experience />
        </Physics>
      </Canvas>
    </div>
  );
}
