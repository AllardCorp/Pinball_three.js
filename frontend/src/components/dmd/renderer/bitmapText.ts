import { MATRIX_WIDTH } from "../dungeonDragonDmd.config";
import type { DiodeTone, RenderMetrics } from "../dungeonDragonDmd.types";
import { FONT_5X7, FONT_WIDTH } from "./bitmapFont";
import { drawRect } from "./primitives";

const ACCENT_REPLACEMENTS: Record<string, string> = {
  à: "a",
  â: "a",
  ä: "a",
  ç: "c",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  î: "i",
  ï: "i",
  ô: "o",
  ö: "o",
  ù: "u",
  û: "u",
  ü: "u",
};

export function normalizeDmdText(text: string) {
  // Le jeu affiche du texte français mais la police DMD est volontairement
  // limitée. Cette table garde la conversion lisible pour la soutenance.
  return [...text.toLowerCase()]
    .map((character) => ACCENT_REPLACEMENTS[character] ?? character)
    .join("")
    .toUpperCase();
}

function getGlyph(character: string) {
  return FONT_5X7[character] ?? FONT_5X7["?"];
}

export function measureBitmapText(text: string, scale: number) {
  const normalizedText = normalizeDmdText(text);

  return [...normalizedText].reduce((width, character, index) => {
    const glyphWidth = character === " " ? 3 : FONT_WIDTH;
    const gap = index === normalizedText.length - 1 ? 0 : 1;

    return width + (glyphWidth + gap) * scale;
  }, 0);
}

export function fitTextScale(text: string, preferredScale: number, maxWidth: number) {
  for (let scale = preferredScale; scale >= 1; scale -= 1) {
    if (measureBitmapText(text, scale) <= maxWidth) {
      return scale;
    }
  }

  return 1;
}

export function drawBitmapText(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  text: string,
  x: number,
  y: number,
  scale: number,
  tone: DiodeTone,
  alpha = 1,
) {
  let cursorX = x;

  for (const character of normalizeDmdText(text)) {
    if (character === " ") {
      cursorX += 4 * scale;
      continue;
    }

    const glyph = getGlyph(character);

    glyph.forEach((row, rowIndex) => {
      [...row].forEach((dot, columnIndex) => {
        if (dot === "1") {
          drawRect(
            context,
            metrics,
            cursorX + columnIndex * scale,
            y + rowIndex * scale,
            scale,
            scale,
            tone,
            alpha,
          );
        }
      });
    });

    cursorX += (FONT_WIDTH + 1) * scale;
  }
}

export function drawRightAlignedText(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  text: string,
  rightX: number,
  y: number,
  scale: number,
  tone: DiodeTone,
  alpha = 1,
) {
  const width = measureBitmapText(text, scale);
  drawBitmapText(context, metrics, text, rightX - width, y, scale, tone, alpha);
}

export function drawCenteredText(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  text: string,
  y: number,
  preferredScale: number,
  tone: DiodeTone,
  alpha = 1,
) {
  const scale = fitTextScale(text, preferredScale, MATRIX_WIDTH - 16);
  const width = measureBitmapText(text, scale);
  const x = Math.round((MATRIX_WIDTH - width) / 2);

  drawBitmapText(context, metrics, text, x, y, scale, tone, alpha);
}

export function drawCenteredTextInBox(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  text: string,
  centerX: number,
  y: number,
  preferredScale: number,
  maxWidth: number,
  tone: DiodeTone,
  alpha = 1,
) {
  const scale = fitTextScale(text, preferredScale, maxWidth);
  const width = measureBitmapText(text, scale);
  const x = Math.round(centerX - width / 2);

  drawBitmapText(context, metrics, text, x, y, scale, tone, alpha);
}

export function drawScrollingText(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  text: string,
  y: number,
  frame: number,
) {
  const scale = 1;
  const textWidth = measureBitmapText(text, scale);
  const travel = MATRIX_WIDTH + textWidth + 20;
  const x = MATRIX_WIDTH - ((frame * 0.65) % travel);

  drawBitmapText(context, metrics, text, x, y, scale, "bright");
}
