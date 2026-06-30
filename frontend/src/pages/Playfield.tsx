import { useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import { Environment } from "@react-three/drei";
import { Leva, button, useControls } from "leva";

import Experience from "../experience/Experience";
import Loader from "../components/Loader";
import { useAppMode } from "../hooks/useAppMode";
import { useScoreClaimSession } from "../hooks/useScoreClaimSession";
import { createGameOverScoreClaimInput } from "../lib/score-claim-gameover";
import { useKeyboardControls } from "../mqtt/useKeyboardControls";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useInputStore } from "@/store/inputStore/useInputStore";

export default function Playfield() {
  const { isArcadeMode, mode } = useAppMode();
  const { resetScoreClaimSession, startScoreClaimSession } =
    useScoreClaimSession({ enabled: isArcadeMode, mode });

  useKeyboardControls();

  const startPressed = useInputStore((state) => state.buttons.start);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const scores = useGameStore((state) => state.scores);
  const startGame = useGameStore((state) => state.startGame);
  const updateInputs = useInputStore((state) => state.updateInputs);

  // Ces refs détectent les transitions de partie sans provoquer de re-render.
  // Elles évitent surtout de créer plusieurs claims pour le même game over.
  const wasPlayingRef = useRef(isPlaying);
  const gameStartedAtRef = useRef<number | null>(isPlaying ? Date.now() : null);
  const submittedGameOverKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (startPressed && !isPlaying) {
      console.log("🎮 Démarrage de la partie depuis MQTT / Bouton Start !");
      startGame(1);
      updateInputs({ buttons: { start: false } });
    }
  }, [startPressed, isPlaying, startGame, updateInputs]);

  useEffect(() => {
    const wasPlaying = wasPlayingRef.current;

    if (isPlaying && !wasPlaying) {
      gameStartedAtRef.current = Date.now();
      submittedGameOverKeyRef.current = null;
      // Une nouvelle partie doit retirer l'ancien QR code du backglass.
      resetScoreClaimSession();
    }

    if (isArcadeMode && wasPlaying && !isPlaying) {
      const endedAtMs = Date.now();
      // Le score envoyé au backend vient du store réel alimenté par addScore,
      // pas d'un champ de test saisi manuellement dans l'interface.
      const scoreClaimInput = createGameOverScoreClaimInput({
        endedAtMs,
        scores,
        startedAtMs: gameStartedAtRef.current,
      });
      const gameOverKey = `${gameStartedAtRef.current ?? "unknown"}:${scores.join(
        "-",
      )}`;

      if (submittedGameOverKeyRef.current !== gameOverKey) {
        submittedGameOverKeyRef.current = gameOverKey;
        void startScoreClaimSession(scoreClaimInput);
      }
    }

    wasPlayingRef.current = isPlaying;
  }, [
    isArcadeMode,
    isPlaying,
    resetScoreClaimSession,
    scores,
    startScoreClaimSession,
  ]);

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
    <div className="relative h-screen w-screen">
      <Leva collapsed />
      <Suspense fallback={<Loader />}>
        <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
          <color attach="background" args={["skyblue"]} />
          {perfVisible && <Perf position="top-left" showGraph />}
          <Environment preset="forest" />
          <Physics debug={rapierDebug} gravity={[gravityX, gravityY, gravityZ]}>
            <Experience />
          </Physics>
        </Canvas>
      </Suspense>
    </div>
  );
}
