import {
  CLASS_ICON_PATTERNS,
  HEART_PATTERN,
  LIVE_LAYOUT,
  MATRIX_WIDTH,
} from "../dungeonDragonDmd.config";
import type {
  DmdIconPatterns,
  DmdSpriteFrames,
  RenderMetrics,
} from "../dungeonDragonDmd.types";
import type { DmdViewModel } from "@/lib/dmd-messages";
import {
  drawCenteredTextInBox,
  drawBitmapText,
  drawRightAlignedText,
  fitTextScale,
  measureBitmapText,
  drawScrollingText,
} from "./bitmapText";
import {
  drawMineBackground,
  drawRubyBackground,
  drawSunBackground,
} from "./effects";
import { drawPattern } from "./primitives";

function drawLives(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
) {
  const { gap, rightPadding, scale, y } = LIVE_LAYOUT.lives;
  const heartWidth = HEART_PATTERN[0].length * scale;
  const startX =
    MATRIX_WIDTH -
    rightPadding -
    heartWidth * viewModel.maxLives -
    gap * (viewModel.maxLives - 1);

  for (let index = 0; index < viewModel.maxLives; index += 1) {
    const x = startX + index * (heartWidth + gap);
    const isLit = index < viewModel.livesRemaining;

    // Les vies perdues restent visibles en très faible intensité : on garde
    // la silhouette sans laisser penser qu'une bille est encore disponible.
    drawPattern(context, metrics, HEART_PATTERN, x, y, scale, "dim", 0.62);

    if (isLit) {
      drawPattern(context, metrics, HEART_PATTERN, x, y, scale, "danger", 0.95);
      drawPattern(context, metrics, HEART_PATTERN, x, y, scale, "bright", 0.12);
    }
  }
}

function drawClassIcon(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  iconPatterns: DmdIconPatterns,
) {
  if (!viewModel.activeClass) {
    return;
  }

  const pattern =
    iconPatterns[viewModel.activeClass] ?? CLASS_ICON_PATTERNS[viewModel.activeClass];
  const width = pattern[0]?.length ?? 0;
  const height = pattern.length;
  const x = Math.round(LIVE_LAYOUT.classIcon.centerX - width / 2);
  const y = Math.round(LIVE_LAYOUT.classIcon.centerY - height / 2);

  // L'icône vient de l'image de classe active, pas du numéro de joueur.
  // Cela évite l'ancien mock P1/P2 et suit le système de classes du gameplay.
  drawPattern(context, metrics, pattern, x, y, 1, "amber", 0.9);
  drawPattern(context, metrics, pattern, x, y, 1, "bright", 0.12);
}

function drawPlayerToken(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
) {
  drawBitmapText(
    context,
    metrics,
    viewModel.playerToken,
    LIVE_LAYOUT.playerToken.x,
    LIVE_LAYOUT.playerToken.y,
    LIVE_LAYOUT.playerToken.scale,
    "danger",
    0.92,
  );
}

function drawScore(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  scoreImpact: number,
  isCentralAnimationActive: boolean,
) {
  const scoreLayout = LIVE_LAYOUT.score;
  const maxWidth = isCentralAnimationActive
    ? scoreLayout.eventMaxWidth
    : scoreLayout.maxWidth;
  const y = isCentralAnimationActive ? scoreLayout.eventY : scoreLayout.normalY;
  const baseScale = fitTextScale(viewModel.scoreText, 2, maxWidth);
  const canUseLargeImpactScale =
    !isCentralAnimationActive && measureBitmapText(viewModel.scoreText, 3) <= maxWidth;
  const scale = scoreImpact > 0.01 && canUseLargeImpactScale ? 3 : baseScale;
  const width = measureBitmapText(viewModel.scoreText, scale);
  const x = Math.round(scoreLayout.centerX - width / 2);
  const tone = scoreImpact > 0.01 ? "bright" : "danger";
  const alpha = scoreImpact > 0.01 ? 0.85 + scoreImpact * 0.15 : 0.92;
  const impactShouldThicken = scoreImpact > 0.01 && !canUseLargeImpactScale;

  if (impactShouldThicken && !isCentralAnimationActive) {
    // Quand le score devient trop long pour passer en scale 3, on simule le
    // grossissement par une épaisseur de diodes autour du texte au lieu de
    // simplement changer sa couleur. Le score reste dans son cadre.
    const glowAlpha = Math.min(0.38, scoreImpact * 0.38);
    drawBitmapText(context, metrics, viewModel.scoreText, x - 1, y, scale, "bright", glowAlpha);
    drawBitmapText(context, metrics, viewModel.scoreText, x + 1, y, scale, "bright", glowAlpha);
    drawBitmapText(context, metrics, viewModel.scoreText, x, y - 1, scale, "bright", glowAlpha);
    drawBitmapText(context, metrics, viewModel.scoreText, x, y + 1, scale, "bright", glowAlpha);
  }

  drawBitmapText(context, metrics, viewModel.scoreText, x, y, scale, tone, alpha);
}

function drawMultiplierSlots(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
) {
  if (viewModel.isSunBonusActive) {
    drawCenteredTextInBox(
      context,
      metrics,
      "X50",
      LIVE_LAYOUT.score.centerX,
      LIVE_LAYOUT.multipliers.x50Y,
      2,
      LIVE_LAYOUT.multipliers.x50MaxWidth,
      "bright",
      1,
    );
    return;
  }

  viewModel.multiplierSlots.forEach((slot, index) => {
    const centerX = LIVE_LAYOUT.multipliers.slots[index] ?? 0;
    const tone = slot.active ? "bright" : "dim";
    const alpha = slot.active ? 0.92 : 0.5;

    drawCenteredTextInBox(
      context,
      metrics,
      slot.label,
      centerX,
      LIVE_LAYOUT.multipliers.slotY,
      1,
      LIVE_LAYOUT.multipliers.maxWidth,
      tone,
      alpha,
    );

    // Pas de soulignement : sur une matrice DMD, les traits horizontaux
    // ressemblent vite à des artefacts et gênent la lecture.
  });
}

function drawFooterMessage(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  const textWidth = measureBitmapText(viewModel.eventMessage, 1);

  if (textWidth > LIVE_LAYOUT.message.scrollThreshold) {
    drawScrollingText(context, metrics, viewModel.eventMessage, LIVE_LAYOUT.message.y, frame);
    return;
  }

  drawCenteredTextInBox(
    context,
    metrics,
    viewModel.eventMessage,
    LIVE_LAYOUT.message.centerX,
    LIVE_LAYOUT.message.y,
    1,
    LIVE_LAYOUT.message.maxWidth,
    "bright",
    0.88,
  );
}

function drawBackgroundEffect(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  mineFrames: DmdSpriteFrames,
  rubyFrames: DmdSpriteFrames,
  frame: number,
) {
  switch (viewModel.backgroundEffect) {
    case "mine":
      drawMineBackground(context, metrics, frame, mineFrames);
      return true;
    case "ruby":
      drawRubyBackground(context, metrics, frame, rubyFrames);
      return true;
    case "sun":
      drawSunBackground(context, metrics, frame);
      return false;
    case "none":
      return false;
  }
}

export function drawLiveHud(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  iconPatterns: DmdIconPatterns,
  mineFrames: DmdSpriteFrames,
  rubyFrames: DmdSpriteFrames,
  frame: number,
  scoreImpact: number,
) {
  const isCentralAnimationActive = drawBackgroundEffect(
    context,
    metrics,
    viewModel,
    mineFrames,
    rubyFrames,
    frame,
  );

  drawPlayerToken(context, metrics, viewModel);
  drawLives(context, metrics, viewModel);
  drawClassIcon(context, metrics, viewModel, iconPatterns);
  drawScore(context, metrics, viewModel, scoreImpact, isCentralAnimationActive);

  // Mine/rubis prennent temporairement la zone centrale. On évite donc de
  // superposer les multiplicateurs ou messages sur l'animation événementielle.
  if (isCentralAnimationActive) {
    drawRightAlignedText(
      context,
      metrics,
      viewModel.footerRight,
      MATRIX_WIDTH - 8,
      55,
      1,
      "dim",
      0.52,
    );
    return;
  }

  drawMultiplierSlots(context, metrics, viewModel);
  drawFooterMessage(context, metrics, viewModel, frame);
}
