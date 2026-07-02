import { useEffect, useRef, useState } from "react";

import { DungeonDragonDmdDisplay } from "@/components/dmd/DungeonDragonDmdDisplay";
import { RUBY_EFFECT_DURATION_MS } from "@/components/dmd/dungeonDragonDmd.config";
import {
  buildDmdViewModel,
  type DmdMultiplierSnapshot,
} from "@/lib/dmd-messages";
import { parseAppMode } from "@/lib/app-mode";
import {
  readScoreClaimSessionSnapshot,
  subscribeToScoreClaimSessionSnapshot,
  type ScoreClaimSessionSnapshot,
} from "@/lib/score-claim-session-store";
import { useGameStore } from "@/store/gameStore/useGameStore";

const GAME_OVER_DISPLAY_MS = 8_000;
const ATTRACT_STEP_MS = 2_800;

type GameOverSnapshot = {
  ballsRemaining: number[];
  currentPlayerIndex: number;
  playerCount: number;
  scores: number[];
};

function readCurrentAppMode() {
  if (typeof window === "undefined") {
    return parseAppMode(null);
  }

  return parseAppMode(new URLSearchParams(window.location.search).get("mode"));
}

function useScoreClaimSnapshotForDmd() {
  const [snapshot, setSnapshot] = useState<ScoreClaimSessionSnapshot>(() =>
    readScoreClaimSessionSnapshot(),
  );

  useEffect(() => {
    // Le DMD ne démarre pas de claim et ne contacte pas l'authentification :
    // il observe uniquement le snapshot produit par Backglass/Playfield.
    return subscribeToScoreClaimSessionSnapshot(() => {
      setSnapshot(readScoreClaimSessionSnapshot());
    });
  }, []);

  return snapshot;
}

export default function DMD() {
  const [attractStep, setAttractStep] = useState(0);
  const [gameOverUntil, setGameOverUntil] = useState(0);
  const [gameOverSnapshot, setGameOverSnapshot] =
    useState<GameOverSnapshot | null>(null);
  const [rubyAnimationVisible, setRubyAnimationVisible] = useState(false);
  const wasPlayingRef = useRef(false);
  const appMode = readCurrentAppMode();
  const scoreClaimSnapshot = useScoreClaimSnapshotForDmd();

  const activeClass = useGameStore((state) => state.activeClass);
  const activeMultipliers = useGameStore((state) => state.activeMultipliers);
  const ballInLauncher = useGameStore((state) => state.ballInLauncher);
  const ballsRemaining = useGameStore((state) => state.ballsRemaining);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPowerOnCooldown = useGameStore((state) => state.isPowerOnCooldown);
  const isUndeathActive = useGameStore((state) => state.isUndeathActive);
  const mineHits = useGameStore((state) => state.mineHits);
  const playerCount = useGameStore((state) => state.playerCount);
  const rubiesActive = useGameStore((state) => state.rubiesActive);
  const scores = useGameStore((state) => state.scores);
  const screenMessage = useGameStore((state) => state.screenMessage);
  const swordActive = useGameStore((state) => state.swordActive);
  const gemsMultiplierExpiresAt = activeMultipliers.gems?.expiresAt ?? 0;

  useEffect(() => {
    const wasPlaying = wasPlayingRef.current;
    const gameHasJustEnded = wasPlaying && !isPlaying;
    const gameHasJustStarted = !wasPlaying && isPlaying;

    wasPlayingRef.current = isPlaying;

    if (!gameHasJustEnded && !gameHasJustStarted) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (gameHasJustEnded) {
        setGameOverSnapshot({
          ballsRemaining,
          currentPlayerIndex,
          playerCount,
          scores,
        });
        setGameOverUntil(Date.now() + GAME_OVER_DISPLAY_MS);
      }

      if (gameHasJustStarted) {
        setGameOverSnapshot(null);
        setGameOverUntil(0);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [ballsRemaining, currentPlayerIndex, isPlaying, playerCount, scores]);

  useEffect(() => {
    if (isPlaying || gameOverUntil <= Date.now()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGameOverUntil(0);
      setGameOverSnapshot(null);
    }, gameOverUntil - Date.now());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [gameOverUntil, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAttractStep((currentStep) => currentStep + 1);
    }, ATTRACT_STEP_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying]);

  useEffect(() => {
    // L'effet rubis est seulement une animation d'annonce courte :
    // le multiplicateur gems continue de vivre dans le store après son affichage.
    const remainingMultiplierTime = gemsMultiplierExpiresAt - Date.now();

    if (!isPlaying || remainingMultiplierTime <= 0) {
      const resetId = window.setTimeout(() => {
        setRubyAnimationVisible(false);
      }, 0);

      return () => {
        window.clearTimeout(resetId);
      };
    }

    const startId = window.setTimeout(() => {
      setRubyAnimationVisible(true);
    }, 0);
    const stopId = window.setTimeout(() => {
      setRubyAnimationVisible(false);
    }, Math.min(RUBY_EFFECT_DURATION_MS, remainingMultiplierTime));

    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(stopId);
    };
  }, [gemsMultiplierExpiresAt, isPlaying]);

  const isGameOverVisible = !isPlaying && gameOverUntil > 0;
  const displayedGameOverSnapshot = isGameOverVisible ? gameOverSnapshot : null;
  const viewModel = buildDmdViewModel({
    activeClass,
    activeMultipliers: activeMultipliers as DmdMultiplierSnapshot,
    appMode,
    attractStep,
    ballInLauncher,
    ballsRemaining: displayedGameOverSnapshot?.ballsRemaining ?? ballsRemaining,
    currentPlayerIndex:
      displayedGameOverSnapshot?.currentPlayerIndex ?? currentPlayerIndex,
    forceGameOver: isGameOverVisible,
    isPlaying,
    isPowerOnCooldown,
    isUndeathActive,
    mineHits,
    playerCount: displayedGameOverSnapshot?.playerCount ?? playerCount,
    rubyAnimationVisible,
    rubiesActive,
    scoreClaimSnapshot,
    scores: displayedGameOverSnapshot?.scores ?? scores,
    screenMessage,
    swordActive,
  });

  return <DungeonDragonDmdDisplay viewModel={viewModel} />;
}
