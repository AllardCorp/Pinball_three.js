import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import Experience from "../experience/Experience";
import { Perf } from "r3f-perf";
import { Leva, useControls, button } from "leva"; // 👈 On ajoute l'import de "button"
import { Environment } from "@react-three/drei";
import { useKeyboardControls } from "../mqtt/useKeyboardControls";
import { useGameStore } from "@/store/useGameStore";
import { useInputStore } from "@/store/useInputStore";

export default function Playfield() {
  // Keyboard → MQTT: Q/D/Space/S/C publish to pinball/input/state
  useKeyboardControls();

  // Démarre la partie automatiquement si le bouton start est reçu
  const startPressed = useInputStore((state) => state.buttons.start);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const startGame = useGameStore((state) => state.startGame);
  const updateInputs = useInputStore((state) => state.updateInputs);

  useEffect(() => {
    if (startPressed && !isPlaying) {
      console.log("🎮 Démarrage de la partie depuis MQTT / Bouton Start !");
      startGame(1); // Par défaut, le bouton physique lance en solo (1 joueur)
      updateInputs({ buttons: { start: false } });
    }
  }, [startPressed, isPlaying, startGame, updateInputs]);

  // 🎛️ BOUTONS DE TEST MULTIJOUEUR DANS LEVA
  useControls("Game Lifecycle", {
    "Start Solo (1P)": button(() => startGame(1)),
    "Start Versus (2P)": button(() => startGame(2)),
    "Start Match (3P)": button(() => startGame(3)),
    "Start Arcade (4P)": button(() => startGame(4)),
  });

  const { perfVisible } = useControls({
    perfVisible: true,
  });
  const { rapierDebug } = useControls("rapier", {
    rapierDebug: true,
  });
  const { gravityX, gravityY, gravityZ } = useControls("Gravity Controls", {
    gravityX: { value: 0, min: -20, max: 20, step: 0.1 },
    gravityY: { value: -80, min: -100, max: 20, step: 0.1 },
    gravityZ: { value: 20, min: -60, max: 20, step: 0.1 },
  });

  return (
    <div className="w-screen h-screen">
      <Leva collapsed />
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
        <color attach="background" args={["skyblue"]} />
        {perfVisible && <Perf position="top-left" showGraph />}
        <Environment preset="forest" />
        <Physics debug={rapierDebug} gravity={[gravityX, gravityY, gravityZ]}>
          <Experience />
        </Physics>
      </Canvas>
    </div>
  );
}
