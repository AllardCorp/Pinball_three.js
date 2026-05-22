import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Leva, useControls } from "leva";
import { Perf } from "r3f-perf";
import { useEffect } from "react";

import ScoreClaimControlPanel from "../components/score-claim/ScoreClaimControlPanel";
import Experience from "../experience/Experience";
import { useAppMode } from "../hooks/useAppMode";
import { useScoreClaimSession } from "../hooks/useScoreClaimSession";
import { useKeyboardControls } from "../mqtt/useKeyboardControls";
import { useGameStore } from "@/store/useGameStore";
import { useInputStore } from "@/store/useInputStore";

export default function Playfield() {
  useKeyboardControls();

  // Démarre la partie automatiquement si le bouton start est reçu via MQTT.
  const startPressed = useInputStore((state) => state.buttons.start);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const startGame = useGameStore((state) => state.startGame);
  const updateInputs = useInputStore((state) => state.updateInputs);

  useEffect(() => {
    if (startPressed && !isPlaying) {
      console.log("🎮 Démarrage de la partie depuis MQTT / Bouton Start !");
      startGame();
      updateInputs({ buttons: { start: false } });
    }
  }, [startPressed, isPlaying, startGame, updateInputs]);

  const { isArcadeMode, mode } = useAppMode();
  const {
    authenticatedUser,
    isSessionPending,
    resetScoreClaimSession,
    snapshot,
    startScoreClaimSession,
  } = useScoreClaimSession({ enabled: isArcadeMode, mode });

  const { perfVisible } = useControls({
    perfVisible: true,
  });

  const { rapierDebug } = useControls("rapier", {
    rapierDebug: false,
  });

  return (
    <div className="relative h-screen w-screen">
      <ScoreClaimControlPanel
        authenticatedUser={authenticatedUser}
        isSessionPending={isSessionPending}
        onReset={resetScoreClaimSession}
        onStart={startScoreClaimSession}
        snapshot={snapshot}
      />

      <Leva collapsed />
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
        <color attach="background" args={["skyblue"]} />
        {perfVisible && <Perf position="top-left" showGraph />}
        <Environment preset="forest" />
        <Physics debug={rapierDebug} gravity={[0, -9.81, 0]}>
          <Experience />
        </Physics>
      </Canvas>
    </div>
  );
}