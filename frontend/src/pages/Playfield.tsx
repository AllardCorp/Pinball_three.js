import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
} from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { ToneMappingMode } from "postprocessing";
import { Perf } from "r3f-perf";
import { Leva } from "leva";

import Loader from "@/components/utils/Loader";
import { useGameDebug } from "@/config/useGameDebug";
import Experience from "@/experience/Experience";
import { useAppMode } from "@/hooks/useAppMode";
import { useScoreClaimSession } from "@/hooks/useScoreClaimSession";
import { createGameOverScoreClaimInput } from "@/lib/score-claim-gameover";
import { useKeyboardControls } from "@/mqtt/useKeyboardControls";
import { usePlayerSelection } from "@/mqtt/usePlayerSelection";
import { useGameStore } from "@/store/gameStore/useGameStore";

export default function Playfield() {

  const { isArcadeMode, mode } = useAppMode();
  const { resetScoreClaimSession, startScoreClaimSession } =
    useScoreClaimSession({ enabled: isArcadeMode, mode });
  const { gravity, perfVisible, rapierDebug } = useGameDebug();

  useKeyboardControls();
  usePlayerSelection();

  const isPlaying = useGameStore((state) => state.isPlaying);
  const scores = useGameStore((state) => state.scores);

  // Ces refs detectent les transitions de partie sans provoquer de re-render.
  // Elles evitent surtout de creer plusieurs claims pour le meme game over.
  const wasPlayingRef = useRef(isPlaying);
  const gameStartedAtRef = useRef<number | null>(isPlaying ? Date.now() : null);
  const submittedGameOverKeyRef = useRef<string | null>(null);

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
      // Le score envoye au backend vient du store reel alimente par addScore,
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

  return (
    <div className="relative h-screen w-screen">
      <Leva collapsed />
      <Suspense fallback={<Loader />}>
        <Canvas dpr={1} shadows camera={{ position: [0, 8, 15], fov: 50 }}>
          <color attach="background" args={["skyblue"]} />
          {perfVisible && <Perf position="top-left" showGraph />}
          <Environment preset="forest" />
          <Physics
            debug={rapierDebug}
            gravity={[gravity.x, gravity.y, gravity.z]}
          >
            <Experience />
          </Physics>
          <EffectComposer>
            <Bloom
              intensity={1.2}
              luminanceSmoothing={0}
              luminanceThreshold={2}
              mipmapBlur
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>
      </Suspense>
    </div>
  );
}
