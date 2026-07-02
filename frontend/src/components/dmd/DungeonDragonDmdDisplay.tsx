import { useEffect, useRef, useState } from "react";

import {
  CLASS_ICON_IMAGE_SOURCES,
  CLASS_ICON_SIZE,
  FRAME_RATE,
  MINE_OPENING_SPRITE_URL,
  MINE_SPRITE_FRAME_COUNT,
  MINE_SPRITE_FRAME_HEIGHT,
  MINE_SPRITE_FRAME_WIDTH,
  RUBY_SPRITE_FRAME_COUNT,
  RUBY_SPRITE_FRAME_HEIGHT,
  RUBY_SPRITE_FRAME_WIDTH,
  RUBY_SPRITE_URL,
} from "./dungeonDragonDmd.config";
import {
  rasterizeImageToDmdPattern,
  rasterizeSpriteSheetToDmdFrames,
} from "./dungeonDragonDmdRaster";
import type { DmdIconPatterns, DmdSpriteFrames } from "./dungeonDragonDmd.types";
import { getCanvasContext, resizeDmdCanvas } from "./renderer/canvas";
import { renderDmdFrame } from "./renderer/scenes";
import type { DmdViewModel } from "@/lib/dmd-messages";

type DungeonDragonDmdDisplayProps = {
  viewModel: DmdViewModel;
};

const SCORE_IMPACT_DURATION_MS = 700;
const DMD_FRAME_INTERVAL_MS = 1000 / FRAME_RATE;

export function DungeonDragonDmdDisplay({
  viewModel,
}: DungeonDragonDmdDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestViewModelRef = useRef(viewModel);
  const lastScoreRef = useRef(viewModel.currentScore);
  const scoreImpactStartedAtRef = useRef(0);
  const [iconPatterns, setIconPatterns] = useState<DmdIconPatterns>({});
  const [mineFrames, setMineFrames] = useState<DmdSpriteFrames>([]);
  const [rubyFrames, setRubyFrames] = useState<DmdSpriteFrames>([]);

  useEffect(() => {
    latestViewModelRef.current = viewModel;

    if (viewModel.currentScore > lastScoreRef.current) {
      scoreImpactStartedAtRef.current = performance.now();
    }

    lastScoreRef.current = viewModel.currentScore;
  }, [viewModel]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handleResize = () => {
      resizeDmdCanvas(canvas);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDmdAssets() {
      const loadedIcons = await Promise.all(
        Object.entries(CLASS_ICON_IMAGE_SOURCES).map(async ([iconName, source]) => {
          return [
            iconName,
            await rasterizeImageToDmdPattern(
              source,
              CLASS_ICON_SIZE,
              CLASS_ICON_SIZE,
            ),
          ] as const;
        }),
      );
      const nextMineFrames = await rasterizeSpriteSheetToDmdFrames(
        MINE_OPENING_SPRITE_URL,
        MINE_SPRITE_FRAME_WIDTH,
        MINE_SPRITE_FRAME_HEIGHT,
        MINE_SPRITE_FRAME_COUNT,
      );
      const nextRubyFrames = await rasterizeSpriteSheetToDmdFrames(
        RUBY_SPRITE_URL,
        RUBY_SPRITE_FRAME_WIDTH,
        RUBY_SPRITE_FRAME_HEIGHT,
        RUBY_SPRITE_FRAME_COUNT,
      );

      if (!isMounted) {
        return;
      }

      setIconPatterns(
        Object.fromEntries(
          loadedIcons.filter((entry) => entry[1] !== null),
        ) as DmdIconPatterns,
      );
      setMineFrames(nextMineFrames ?? []);
      setRubyFrames(nextRubyFrames ?? []);
    }

    loadDmdAssets().catch((error) => {
      console.error("DMD assets loading failed:", error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas ? getCanvasContext(canvas) : null;

    if (!canvas || !context) {
      return;
    }

    let animationFrameId = 0;
    let lastFrameAt = 0;
    let frame = 0;

    const draw = (timestamp: number) => {
      if (timestamp - lastFrameAt >= DMD_FRAME_INTERVAL_MS) {
        const impactAge = timestamp - scoreImpactStartedAtRef.current;
        const scoreImpact =
          impactAge < SCORE_IMPACT_DURATION_MS
            ? 1 - impactAge / SCORE_IMPACT_DURATION_MS
            : 0;

        frame += 1;
        lastFrameAt = timestamp;
        renderDmdFrame({
          canvas,
          context,
          frame,
          iconPatterns,
          mineFrames,
          rubyFrames,
          scoreImpact,
          viewModel: latestViewModelRef.current,
        });
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    animationFrameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [iconPatterns, mineFrames, rubyFrames]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-0">
      <canvas
        ref={canvasRef}
        aria-label="DMD Donjons et Flippers"
        className="block h-screen w-screen"
      />
    </div>
  );
}
