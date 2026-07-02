import type {
  DmdIconPatterns,
  DmdSpriteFrames,
} from "../dungeonDragonDmd.types";
import { SCENE_LAYOUT } from "../dungeonDragonDmd.config";
import type { DmdViewModel } from "@/lib/dmd-messages";
import { drawBackgroundGrid, getRenderMetrics } from "./canvas";
import {
  drawCenteredText,
  drawCenteredTextInBox,
  drawScrollingText,
} from "./bitmapText";
import {
  drawClaimArch,
  drawClaimSeal,
  drawCoinPromptOrnament,
  drawGameOverExplosion,
  drawTorch,
} from "./effects";
import { drawLiveHud } from "./liveHud";

function drawAttractScene(
  context: CanvasRenderingContext2D,
  metrics: ReturnType<typeof getRenderMetrics>,
  viewModel: DmdViewModel,
  frame: number,
) {
  drawCoinPromptOrnament(context, metrics, frame);
  drawCenteredText(
    context,
    metrics,
    viewModel.headline,
    SCENE_LAYOUT.attract.headlineY,
    2,
    "bright",
    0.94,
  );
  drawScrollingText(context, metrics, viewModel.subline, SCENE_LAYOUT.attract.scrollY, frame);
}

function drawGameOverScene(
  context: CanvasRenderingContext2D,
  metrics: ReturnType<typeof getRenderMetrics>,
  viewModel: DmdViewModel,
  frame: number,
) {
  drawGameOverExplosion(context, metrics, frame);
  drawCenteredText(
    context,
    metrics,
    viewModel.headline,
    SCENE_LAYOUT.gameOver.headlineY,
    2,
    "danger",
    1,
  );
  drawCenteredTextInBox(
    context,
    metrics,
    viewModel.scoreText,
    SCENE_LAYOUT.gameOver.centerX,
    SCENE_LAYOUT.gameOver.scoreY,
    2,
    136,
    "bright",
    0.94,
  );
}

function drawScoreClaimScene(
  context: CanvasRenderingContext2D,
  metrics: ReturnType<typeof getRenderMetrics>,
  viewModel: DmdViewModel,
  frame: number,
) {
  drawClaimSeal(context, metrics, 38, 32, frame);
  drawClaimArch(context, metrics, frame);
  drawCenteredTextInBox(
    context,
    metrics,
    viewModel.headline,
    96,
    18,
    2,
    112,
    viewModel.accent === "danger" ? "danger" : "bright",
    0.95,
  );
  drawCenteredTextInBox(
    context,
    metrics,
    viewModel.subline,
    96,
    38,
    1,
    112,
    "amber",
    0.86,
  );
  drawCenteredTextInBox(
    context,
    metrics,
    viewModel.scoreText,
    96,
    54,
    1,
    112,
    "bright",
    0.8,
  );
}

function drawUnknownScene(
  context: CanvasRenderingContext2D,
  metrics: ReturnType<typeof getRenderMetrics>,
  viewModel: DmdViewModel,
  frame: number,
) {
  drawTorch(context, metrics, 34, 20, frame);
  drawTorch(context, metrics, 154, 20, frame + 12);
  drawCenteredText(context, metrics, viewModel.headline, 24, 2, "bright", 0.9);
  drawCenteredText(context, metrics, viewModel.subline, 43, 1, "amber", 0.86);
}

export function renderDmdFrame({
  canvas,
  context,
  frame,
  iconPatterns,
  mineFrames,
  rubyFrames,
  scoreImpact,
  viewModel,
}: {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  frame: number;
  iconPatterns: DmdIconPatterns;
  mineFrames: DmdSpriteFrames;
  rubyFrames: DmdSpriteFrames;
  scoreImpact: number;
  viewModel: DmdViewModel;
}) {
  const metrics = getRenderMetrics(canvas);

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackgroundGrid(context, canvas, metrics);

  // Les scènes sont exclusives : une seule responsabilité d'affichage par
  // frame. C'est ce qui évite les superpositions vues dans les prototypes.
  switch (viewModel.mode) {
    case "attract":
      drawAttractScene(context, metrics, viewModel, frame);
      break;
    case "game-over":
      drawGameOverScene(context, metrics, viewModel, frame);
      break;
    case "score-claim":
      drawScoreClaimScene(context, metrics, viewModel, frame);
      break;
    case "live":
      drawLiveHud(
        context,
        metrics,
        viewModel,
        iconPatterns,
        mineFrames,
        rubyFrames,
        frame,
        scoreImpact,
      );
      break;
    default:
      drawUnknownScene(context, metrics, viewModel, frame);
      break;
  }

  // Aucun cadre horizontal ajouté ici : les diodes éteintes du fond suffisent.
  // Les lignes décoratives rendaient des artefacts visibles près des éléments.
}
