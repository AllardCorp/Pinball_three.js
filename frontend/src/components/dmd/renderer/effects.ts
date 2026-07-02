import {
  LIVE_LAYOUT,
  MINE_SPRITE_FRAME_HEIGHT,
  MINE_SPRITE_FRAME_WIDTH,
  RUBY_SPRITE_FRAME_HEIGHT,
  RUBY_SPRITE_FRAME_WIDTH,
  SCENE_LAYOUT,
} from "../dungeonDragonDmd.config";
import type {
  DiodeTone,
  DmdSpriteFrames,
  RenderMetrics,
} from "../dungeonDragonDmd.types";
import { drawPattern, drawRect, drawDiode } from "./primitives";

export function drawTorch(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  x: number,
  y: number,
  frame: number,
) {
  const flameAlpha = 0.72 + Math.sin(frame * 0.22 + x) * 0.2;

  drawRect(context, metrics, x + 2, y + 5, 2, 9, "dim", 0.9);
  drawRect(context, metrics, x + 1, y + 2, 4, 4, "amber", flameAlpha);
  drawRect(context, metrics, x + 2, y, 2, 3, "bright", flameAlpha);
}

export function drawCoinPromptOrnament(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const centerX = SCENE_LAYOUT.attract.coinCenterX;
  const centerY = SCENE_LAYOUT.attract.coinCenterY;
  const pulse = 0.58 + Math.sin(frame * 0.12) * 0.18;

  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    const x = Math.round(centerX + Math.cos(angle) * 14);
    const y = Math.round(centerY + Math.sin(angle) * 8);
    drawDiode(context, metrics, x, y, "bright", pulse);
  }

  drawRect(context, metrics, centerX - 1, centerY - 8, 2, 16, "amber", pulse);
  drawRect(context, metrics, centerX - 6, centerY - 1, 12, 2, "amber", pulse);
  drawTorch(context, metrics, 32, 16, frame);
  drawTorch(context, metrics, 154, 16, frame + 16);
}

export function drawGameOverExplosion(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const centerX = SCENE_LAYOUT.gameOver.centerX;
  const centerY = SCENE_LAYOUT.gameOver.explosionCenterY;
  const cycle = frame % 72;
  const expansion = cycle / 72;
  const particles = 28;

  for (let index = 0; index < particles; index += 1) {
    const angle = (index / particles) * Math.PI * 2;
    const distance = 8 + expansion * 42 + (index % 4) * 2;
    const x = Math.round(centerX + Math.cos(angle) * distance);
    const y = Math.round(centerY + Math.sin(angle) * distance * 0.52);
    const tone: DiodeTone =
      index % 3 === 0 ? "bright" : index % 3 === 1 ? "amber" : "danger";
    const alpha = Math.max(0.15, 0.9 - expansion * 0.75);

    drawDiode(context, metrics, x, y, tone, alpha);
    drawDiode(
      context,
      metrics,
      x + Math.round(Math.cos(angle)),
      y,
      tone,
      alpha * 0.7,
    );
  }
}

export function drawClaimSeal(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  centerX: number,
  centerY: number,
  frame: number,
) {
  const pulse = 0.58 + Math.sin(frame * 0.18) * 0.16;

  for (let offset = 0; offset <= 10; offset += 1) {
    drawDiode(context, metrics, centerX + offset, centerY - 10 + offset, "amber", pulse);
    drawDiode(context, metrics, centerX - offset, centerY - 10 + offset, "amber", pulse);
    drawDiode(context, metrics, centerX + offset, centerY + 10 - offset, "amber", pulse);
    drawDiode(context, metrics, centerX - offset, centerY + 10 - offset, "amber", pulse);
  }

  drawRect(context, metrics, centerX - 1, centerY - 8, 2, 16, "bright", pulse);
  drawRect(context, metrics, centerX - 7, centerY - 1, 14, 2, "bright", pulse);
  drawDiode(context, metrics, centerX, centerY, "danger", 0.78);
}

export function drawClaimArch(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const pulse = 0.55 + Math.sin(frame * 0.16) * 0.14;

  drawRect(context, metrics, 148, 18, 4, 27, "amber", 0.42);
  drawRect(context, metrics, 166, 18, 4, 27, "amber", 0.42);
  drawRect(context, metrics, 152, 14, 14, 4, "amber", 0.45);
  drawRect(context, metrics, 155, 18, 8, 2, "bright", pulse);

  for (let y = 22; y < 42; y += 5) {
    drawDiode(context, metrics, 151, y, "bright", pulse);
    drawDiode(context, metrics, 167, y, "bright", pulse);
  }
}

export function drawSunBackground(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const pulse = 0.28 + Math.sin(frame * 0.18) * 0.1;
  const centerX = 96;
  const centerY = 28;

  for (let radius = 5; radius <= 27; radius += 5) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = Math.round(centerX + Math.cos(angle + frame * 0.015) * radius);
      const y = Math.round(
        centerY + Math.sin(angle + frame * 0.015) * radius * 0.55,
      );
      drawDiode(context, metrics, x, y, "amber", pulse);
    }
  }
}

export function drawRubyBackground(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
  rubyFrames: DmdSpriteFrames,
) {
  const layout = LIVE_LAYOUT.rubyAnimation;

  if (rubyFrames.length > 0) {
    const frameIndex =
      Math.floor(frame / layout.frameHold) % Math.max(1, rubyFrames.length);
    const rubyFrame = rubyFrames[frameIndex];
    const x = Math.round(layout.centerX - RUBY_SPRITE_FRAME_WIDTH / 2);
    const y = Math.round(layout.centerY - RUBY_SPRITE_FRAME_HEIGHT / 2);
    const pulse = 0.9 + Math.sin(frame * 0.18) * 0.08;

    drawPattern(
      context,
      metrics,
      rubyFrame,
      x,
      y,
      1,
      "danger",
      Math.min(1, layout.alpha * pulse),
    );
    drawPattern(context, metrics, rubyFrame, x, y, 1, "bright", 0.18);
    return;
  }

  const animationStep = Math.floor(frame / layout.frameHold);
  const grow = (Math.sin(animationStep * 0.44) + 1) / 2;
  const radiusX = Math.round(
    layout.minRadiusX + (layout.maxRadiusX - layout.minRadiusX) * grow,
  );
  const radiusY = Math.round(
    layout.minRadiusY + (layout.maxRadiusY - layout.minRadiusY) * grow,
  );

  for (let y = -radiusY; y <= radiusY; y += 1) {
    const rowRatio = 1 - Math.abs(y) / Math.max(1, radiusY);
    const rowWidth = Math.max(1, Math.round(radiusX * rowRatio));

    for (let x = -rowWidth; x <= rowWidth; x += 1) {
      const isOutline =
        Math.abs(Math.abs(x) - rowWidth) <= 1 || Math.abs(y) >= radiusY - 1;
      const isFacet =
        Math.abs(x - Math.round(y * 0.55)) <= 1 ||
        Math.abs(x + Math.round(y * 0.4)) <= 1;
      const tone: DiodeTone = isOutline || isFacet ? "bright" : "danger";
      const alpha = isOutline ? layout.alpha : isFacet ? 0.78 : 0.5;

      drawDiode(context, metrics, layout.centerX + x, layout.centerY + y, tone, alpha);
    }
  }

  for (let index = 0; index < layout.sparkleCount; index += 1) {
    const angle = frame * 0.05 + index * ((Math.PI * 2) / layout.sparkleCount);
    const distancePulse = 0.75 + Math.sin(frame * 0.08 + index) * 0.18;
    const sparkleX = Math.round(
      layout.centerX + Math.cos(angle) * layout.sparkleRadiusX * distancePulse,
    );
    const sparkleY = Math.round(
      layout.centerY +
        Math.sin(angle * 1.35) * layout.sparkleRadiusY * distancePulse,
    );
    const tone: DiodeTone = index % 4 === 0 ? "bright" : "amber";
    const alpha = 0.44 + Math.sin(frame * 0.16 + index) * 0.22;

    drawDiode(context, metrics, sparkleX, sparkleY, tone, alpha);
  }
}

export function drawMineBackground(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
  mineFrames: DmdSpriteFrames,
) {
  const frameIndex =
    Math.floor(frame / LIVE_LAYOUT.mineAnimation.frameHold) %
    Math.max(1, mineFrames.length);
  const mineFrame = mineFrames[frameIndex];

  if (mineFrame) {
    const x = Math.round(
      LIVE_LAYOUT.mineAnimation.centerX - MINE_SPRITE_FRAME_WIDTH / 2,
    );
    const y = Math.round(
      LIVE_LAYOUT.mineAnimation.centerY - MINE_SPRITE_FRAME_HEIGHT / 2,
    );

    drawPattern(
      context,
      metrics,
      mineFrame,
      x,
      y,
      1,
      "amber",
      LIVE_LAYOUT.mineAnimation.alpha,
    );
    return;
  }

  const pulse = 0.24 + Math.sin(frame * 0.2) * 0.08;

  for (let y = 18; y < 42; y += 4) {
    const width = Math.floor((y - 14) * 1.45);
    drawRect(context, metrics, 96 - width, y, width * 2, 1, "amber", pulse);
  }
}
