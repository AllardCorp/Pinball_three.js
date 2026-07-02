import {
  DIODE_COLORS,
  MATRIX_HEIGHT,
  MATRIX_WIDTH,
} from "../dungeonDragonDmd.config";
import type { DiodeTone, RenderMetrics } from "../dungeonDragonDmd.types";

export function drawDiode(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  x: number,
  y: number,
  tone: DiodeTone,
  alpha = 1,
) {
  if (x < 0 || x >= MATRIX_WIDTH || y < 0 || y >= MATRIX_HEIGHT) {
    return;
  }

  const centerX = (x + 0.5) * metrics.cellWidth;
  const centerY = (y + 0.5) * metrics.cellHeight;

  context.globalAlpha = alpha;
  context.fillStyle = DIODE_COLORS[tone];
  context.beginPath();
  context.arc(centerX, centerY, metrics.radius, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
}

export function drawRect(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  x: number,
  y: number,
  width: number,
  height: number,
  tone: DiodeTone,
  alpha = 1,
) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      drawDiode(context, metrics, column, row, tone, alpha);
    }
  }
}

export function drawPattern(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  pattern: readonly string[],
  x: number,
  y: number,
  scale: number,
  tone: DiodeTone,
  alpha = 1,
) {
  pattern.forEach((row, rowIndex) => {
    [...row].forEach((dot, columnIndex) => {
      if (dot === "1") {
        drawRect(
          context,
          metrics,
          x + columnIndex * scale,
          y + rowIndex * scale,
          scale,
          scale,
          tone,
          alpha,
        );
      }
    });
  });
}
