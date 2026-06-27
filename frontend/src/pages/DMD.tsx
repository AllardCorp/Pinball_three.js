import { useEffect, useRef, useState } from "react";

import DungeonDragonDmdDisplay from "@/components/dmd/DungeonDragonDmdDisplay";
import { useAppMode } from "@/hooks/useAppMode";
import { buildDmdViewModel } from "@/lib/dmd-messages";
import { useGameStore } from "@/store/useGameStore";

const GAME_OVER_DISPLAY_MS = 10000;

// Snapshot de l'état de jeu au moment du GAME OVER
type GameOverSnapshot = {
  ballsRemaining: number[];
  currentPlayerIndex: number;
  playerCount: number;
  scores: number[];
};

// Function DMD pour afficher l'état du jeu
export default function DMD() {
  const { mode } = useAppMode();
  const [attractStep, setAttractStep] = useState(0);
  const [gameOverSnapshot, setGameOverSnapshot] =
    useState<GameOverSnapshot | null>(null);
  const [isGameOverSequenceActive, setIsGameOverSequenceActive] = useState(false);
  const currentSnapshotRef = useRef<GameOverSnapshot | null>(null);
  const lastLiveSnapshotRef = useRef<GameOverSnapshot | null>(null);
  const previousIsPlayingRef = useRef(false);



  const isPlaying = useGameStore((state) => state.isPlaying);
  const playerCount = useGameStore((state) => state.playerCount); // Nombre de joueurs dans la partie 
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex); 
  const scores = useGameStore((state) => state.scores);
  const ballsRemaining = useGameStore((state) => state.ballsRemaining); // Nombre de billes restantes pour chaque joueur
  const scoreMultiplier = useGameStore((state) => state.scoreMultiplier);
  const ballInLauncher = useGameStore((state) => state.ballInLauncher); 
  const mineHits = useGameStore((state) => state.mineHits);
  const rubiesActive = useGameStore((state) => state.rubiesActive); 
  const leftKickbackActive = useGameStore((state) => state.leftKickbackActive); // Indique si le kickback gauche est actif
  const rightKickbackActive = useGameStore((state) => state.rightKickbackActive); // Indique si le kickback (function pour lancer la bille dans la partie) droit est actif
  const screenMessage = useGameStore((state) => state.screenMessage);

  // On garde toujours le dernier état reçu, et pendant la partie on conserve
  // aussi le dernier état live complet.
  // Cela permet d'afficher GAME OVER avec le vrai score même si le store est
  // remis à zéro immédiatement après la fin de partie.
  useEffect(() => {
    const snapshot = {
      ballsRemaining: [...ballsRemaining],
      currentPlayerIndex,
      playerCount,
      scores: [...scores],
    };

    currentSnapshotRef.current = snapshot;

    if (isPlaying) {
      lastLiveSnapshotRef.current = snapshot;
    }
  }, [ballsRemaining, currentPlayerIndex, isPlaying, playerCount, scores]);

  // GAME OVER est une séquence DMD locale : elle démarre uniquement sur la
  // transition true -> false de `isPlaying`, puis disparaît automatiquement.
  useEffect(() => {
    const wasPlaying = previousIsPlayingRef.current;
    previousIsPlayingRef.current = isPlaying;

    if (!wasPlaying || isPlaying) {
      if (isPlaying) {
        const resetTimeoutId = window.setTimeout(() => {
          setIsGameOverSequenceActive(false);
          setGameOverSnapshot(null);
        }, 0);

        return () => {
          window.clearTimeout(resetTimeoutId);
        };
      }

      return;
    }

    const snapshot = lastLiveSnapshotRef.current ?? currentSnapshotRef.current;
    const startTimeoutId = window.setTimeout(() => {
      setGameOverSnapshot(snapshot);
      setIsGameOverSequenceActive(true);
    }, 0);

    const stopTimeoutId = window.setTimeout(() => {
      setIsGameOverSequenceActive(false);
      setGameOverSnapshot(null);
    }, GAME_OVER_DISPLAY_MS);

    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(stopTimeoutId);
    };
  }, [isPlaying]);

  // L'attract mode est local à l'écran DMD : il ne modifie jamais l'état de partie.
  useEffect(() => {
    if (isPlaying) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAttractStep((currentStep) => currentStep + 1);
    }, 2800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying]);

  const displayedScores =
    isGameOverSequenceActive && gameOverSnapshot
      ? gameOverSnapshot.scores
      : scores;
  const displayedBallsRemaining =
    isGameOverSequenceActive && gameOverSnapshot
      ? gameOverSnapshot.ballsRemaining.map(() => 0)
      : ballsRemaining;
  const displayedCurrentPlayerIndex =
    isGameOverSequenceActive && gameOverSnapshot
      ? gameOverSnapshot.currentPlayerIndex
      : currentPlayerIndex;
  const displayedPlayerCount =
    isGameOverSequenceActive && gameOverSnapshot
      ? gameOverSnapshot.playerCount
      : playerCount;

  const viewModel = buildDmdViewModel({
    appMode: mode,
    attractStep,
    ballInLauncher,
    ballsRemaining: displayedBallsRemaining,
    currentPlayerIndex: displayedCurrentPlayerIndex,
    forceGameOver: isGameOverSequenceActive,
    isPlaying,
    leftKickbackActive,
    mineHits,
    playerCount: displayedPlayerCount,
    rightKickbackActive,
    rubiesActive,
    scoreMultiplier,
    scores: displayedScores,
    screenMessage,
  });

  return <DungeonDragonDmdDisplay viewModel={viewModel} />;
}
