import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import Experience from "../experience/Experience";
import { Perf } from "r3f-perf";
import { Leva, useControls } from "leva";
import { useKeyboardControls } from "../mqtt/useKeyboardControls";

export default function Playfield() {
  // Keyboard → MQTT: Q/D/Space/S/C publish to pinball/input/state
  useKeyboardControls();

  const { perfVisible } = useControls({
    perfVisible: true,
  });
  const { rapierDebug } = useControls("rapier", {
    rapierDebug: false,
  });

  return (
    <div className="w-screen h-screen">
      <Leva collapsed />
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
        <color attach="background" args={["skyblue"]} />
        {perfVisible && <Perf position="top-left" showGraph />}
        <Physics debug={rapierDebug} gravity={[0, -9.81, 0]}>
          <Experience />
        </Physics>
      </Canvas>
    </div>
  );
}
