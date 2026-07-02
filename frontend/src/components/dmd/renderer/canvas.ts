import { MATRIX_HEIGHT, MATRIX_WIDTH } from "../dungeonDragonDmd.config";
import type { RenderMetrics } from "../dungeonDragonDmd.types";
import { drawDiode } from "./primitives";

export function getCanvasContext(canvas: HTMLCanvasElement) {
  return canvas.getContext("2d", { alpha: false });
}

export function resizeDmdCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
}

export function getRenderMetrics(canvas: HTMLCanvasElement): RenderMetrics {
  const cellWidth = canvas.width / MATRIX_WIDTH;
  const cellHeight = canvas.height / MATRIX_HEIGHT;
  const diodeRadius = Math.min(cellWidth, cellHeight) * 0.34;

  return {
    cellHeight,
    cellWidth,
    radius: Math.max(1, diodeRadius),
  };
}

export function drawBackgroundGrid(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  metrics: RenderMetrics,
) {
  context.fillStyle = "#050403";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Les diodes éteintes restent visibles pour retrouver l'aspect physique
  // d'une vraie matrice DMD.
  for (let y = 0; y < MATRIX_HEIGHT; y += 1) {
    for (let x = 0; x < MATRIX_WIDTH; x += 1) {
      drawDiode(context, metrics, x, y, "stone", 0.7);
    }
  }
}
