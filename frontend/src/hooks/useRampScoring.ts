import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

export function useRampScoring(
  currentSurfaceRef: React.RefObject<string>,
  isPlaying: boolean,
) {
  const scoreTimerRef = useRef(0);
  const addScore = useGameStore((state) => state.addScore);

  useFrame((_, delta) => {
    // Si la partie n'est pas en cours, on ne compte pas
    if (!isPlaying) {
      scoreTimerRef.current = 0;
      return;
    }

    const surface = currentSurfaceRef.current;
    const isOnRockRamp = surface === "stone_ramp" || surface === "coll_faquir";
    const isOnRamps = surface === "coll_ramps";

    if (isOnRockRamp || isOnRamps) {
      // Accumule le temps passé sur la rampe
      scoreTimerRef.current += delta;

      // Si 0.5s se sont écoulées
      if (scoreTimerRef.current >= 0.5) {
        addScore(SCORE_VALUES.rampHabit); // Ajoute 10 points
        scoreTimerRef.current -= 0.5; // On retire 0.5 pour garder le reliquat (précision absolue)
      }
    } else {
      // Si on quitte la rampe, on réinitialise le chrono
      scoreTimerRef.current = 0;
    }
  });
}
