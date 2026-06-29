import { useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import { Environment } from "@react-three/drei";
import { Leva } from "leva";
import {
  EffectComposer,
  Bloom,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import ScoreClaimControlPanel from "../components/score-claim/ScoreClaimControlPanel";
import Experience from "../experience/Experience";
import Loader from "../components/utils/Loader";
import { useAppMode } from "../hooks/useAppMode";
import { useScoreClaimSession } from "../hooks/useScoreClaimSession";
import { useKeyboardControls } from "../mqtt/useKeyboardControls";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useInputStore } from "@/store/inputStore/useInputStore";
import { useGameDebug } from "@/config/useGameDebug";

export default function Playfield() {
  const { isArcadeMode, mode } = useAppMode();
  const {
    authenticatedUser,
    isSessionPending,
    resetScoreClaimSession,
    snapshot,
    startScoreClaimSession,
  } = useScoreClaimSession({ enabled: isArcadeMode, mode });

  useKeyboardControls();

  const startPressed = useInputStore((state) => state.buttons.front_left_green);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const startGame = useGameStore((state) => state.startGame);
  const updateInputs = useInputStore((state) => state.updateInputs);

  useEffect(() => {
    if (startPressed && !isPlaying) {
      console.log("🎮 Démarrage de la partie depuis MQTT / Bouton Start !");
      startGame(1);
      updateInputs({ buttons: { front_left_green: false } });
    }
  }, [startPressed, isPlaying, startGame, updateInputs]);

  const { rapierDebug, gravity, perfVisible } = useGameDebug();

  return (
    <div className="relative h-screen w-screen">
      {isArcadeMode && (
        <ScoreClaimControlPanel
          authenticatedUser={authenticatedUser}
          isSessionPending={isSessionPending}
          onReset={resetScoreClaimSession}
          onStart={startScoreClaimSession}
          snapshot={snapshot}
        />
      )}

      <Leva collapsed />
      <Suspense fallback={<Loader />}>
        <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
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
              luminanceThreshold={2} // Seuil minimal pour pour le bloom (isole l'épée du plateau)
              luminanceSmoothing={0} // Empêche la diffusion du bloom sur les autres objets (plateau, personnages) pour éviter un effet brouillard
              mipmapBlur // Utilise un flou basé sur les mipmaps pour un bloom plus naturel
              intensity={1.2}
            />
            {/* Attribution du Tone Maping pour des couleurs intenses */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>
      </Suspense>
    </div>
  );
}
