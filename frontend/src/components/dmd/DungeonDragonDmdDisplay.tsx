import { useEffect, useRef } from "react";

import {
  CLASS_ICON_IMAGE_SOURCES,
  CLASS_ICON_PATTERNS,
  CLASS_ICON_SIZE,
  DIODE_COLORS,
  FONT_5X7,
  FONT_WIDTH,
  FRAME_RATE,
  HEART_PATTERN,
  LIVE_LAYOUT,
  MATRIX_HEIGHT,
  MATRIX_WIDTH,
  MINE_OPENING_SPRITE_URL,
  MINE_SPRITE_FRAME_COUNT,
  MINE_SPRITE_FRAME_HEIGHT,
  MINE_SPRITE_FRAME_WIDTH,
  SCENE_LAYOUT,
  type ClassIcon,
  type DiodeTone,
  type DmdIconPatterns,
  type DmdSpriteFrames,
  type RenderMetrics,
} from "@/components/dmd/dungeonDragonDmd.config";
import {
  rasterizeImageToDmdPattern,
  rasterizeSpriteSheetToDmdFrames,
} from "@/components/dmd/dungeonDragonDmdRaster";
import type { DmdViewModel } from "@/lib/dmd-messages";

type DungeonDragonDmdDisplayProps = {
  viewModel: DmdViewModel;
};

function getCanvasContext(canvas: HTMLCanvasElement) {
  return canvas.getContext("2d", { alpha: false });
}

// Convertit la grille logique 192x64 vers la taille physique du canvas.
// Le pas horizontal et vertical est volontairement indépendant pour remplir
// toute la dalle 16:9 sans bandes noires.
function getMetrics(canvas: HTMLCanvasElement): RenderMetrics {
  const cellWidth = canvas.width / MATRIX_WIDTH;
  const cellHeight = canvas.height / MATRIX_HEIGHT;
  const diodeRadius = Math.min(cellWidth, cellHeight) * 0.34;

  return {
    cellHeight,
    cellWidth,
    // La grille logique 192x64 remplit volontairement tout le canvas 16:9.
    radius: Math.max(1, diodeRadius),
  };
}

// Primitive de base du renderer : chaque pixel logique devient une diode.
// Toutes les autres fonctions finissent par appeler `drawDiode`.
function drawDiode(
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

function normalizeDmdText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function getGlyph(character: string) {
  return FONT_5X7[character] ?? FONT_5X7["?"];
}

function drawRect(
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

function drawPattern(
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

function drawBackgroundGrid(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  metrics: RenderMetrics,
) {
  context.fillStyle = "#050403";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Toutes les diodes éteintes restent visibles pour donner la matière de l'écran physique.
  for (let y = 0; y < MATRIX_HEIGHT; y += 1) {
    for (let x = 0; x < MATRIX_WIDTH; x += 1) {
      drawDiode(context, metrics, x, y, "stone", 0.7);
    }
  }
}

function measureBitmapText(text: string, scale: number) {
  const normalizedText = normalizeDmdText(text);

  return [...normalizedText].reduce((width, character, index) => {
    const glyphWidth = character === " " ? 3 : FONT_WIDTH;
    const gap = index === normalizedText.length - 1 ? 0 : 1;

    return width + (glyphWidth + gap) * scale;
  }, 0);
}

function fitTextScale(text: string, preferredScale: number, maxWidth: number) {
  for (let scale = preferredScale; scale >= 1; scale -= 1) {
    if (measureBitmapText(text, scale) <= maxWidth) {
      return scale;
    }
  }

  return 1;
}

function drawBitmapText(
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

function drawRightAlignedText(
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

function drawCenteredText(
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

function drawCenteredTextInBox(
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

function drawCoinPromptOrnament(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const centerX = SCENE_LAYOUT.attract.coinCenterX;
  const centerY = SCENE_LAYOUT.attract.coinCenterY;
  const pulse = 0.58 + Math.sin(frame * 0.12) * 0.18;

  // Pièce stylisée en diodes : elle donne immédiatement l'idée "insert coin"
  // sans afficher un pictogramme réaliste ou trop détaillé pour la matrice.
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    const x = Math.round(centerX + Math.cos(angle) * 14);
    const y = Math.round(centerY + Math.sin(angle) * 8);
    drawDiode(context, metrics, x, y, "bright", pulse);
  }

  drawRect(context, metrics, centerX - 1, centerY - 8, 2, 16, "amber", pulse);
  drawRect(context, metrics, centerX - 6, centerY - 1, 12, 2, "amber", pulse);

  // Deux petits repères latéraux donnent un style borne / donjon sans surcharger.
  drawTorch(context, metrics, 32, 16, frame);
  drawTorch(context, metrics, 154, 16, frame + 16);
}

function drawGameOverExplosion(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const centerX = SCENE_LAYOUT.gameOver.centerX;
  const centerY = SCENE_LAYOUT.gameOver.explosionCenterY;
  const cycle = frame % 72;
  const expansion = cycle / 72;
  const particles = 28;

  // Explosion volontairement légère : elle anime l'écran de fin sans masquer
  // le texte GAME OVER, qui reste l'information principale.
  for (let index = 0; index < particles; index += 1) {
    const angle = (index / particles) * Math.PI * 2;
    const distance = 8 + expansion * 42 + (index % 4) * 2;
    const x = Math.round(centerX + Math.cos(angle) * distance);
    const y = Math.round(centerY + Math.sin(angle) * distance * 0.52);
    const tone: DiodeTone = index % 3 === 0 ? "bright" : index % 3 === 1 ? "amber" : "danger";
    const alpha = Math.max(0.15, 0.9 - expansion * 0.75);

    drawDiode(context, metrics, x, y, tone, alpha);
    drawDiode(context, metrics, x + Math.round(Math.cos(angle)), y, tone, alpha * 0.7);
  }

  for (let radius = 3; radius <= 12; radius += 3) {
    const ringAlpha = Math.max(0.08, 0.38 - expansion * 0.22);

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = Math.round(centerX + Math.cos(angle + frame * 0.03) * radius);
      const y = Math.round(centerY + Math.sin(angle + frame * 0.03) * radius * 0.55);
      drawDiode(context, metrics, x, y, "danger", ringAlpha);
    }
  }
}

function drawScrollingText(
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

function drawTorch(
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

function drawClaimSeal(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  centerX: number,
  centerY: number,
  frame: number,
) {
  const pulse = 0.58 + Math.sin(frame * 0.18) * 0.16;

  // Sceau abstrait temporaire : il donne une présence médiévale sans figer
  // l'intégration finale des images figuratives.
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

function drawClaimArch(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const pulse = 0.55 + Math.sin(frame * 0.16) * 0.14;

  drawRect(context, metrics, 148, 18, 4, 27, "amber", 0.42);
  drawRect(context, metrics, 166, 18, 4, 27, "amber", 0.42);
  drawRect(context, metrics, 152, 14, 14, 4, "amber", 0.45);
  drawRect(context, metrics, 155, 18, 8, 2, "bright", pulse);

  for (let y = 21; y < 45; y += 1) {
    const width = Math.max(0, Math.floor((y - 19) * 0.34));
    drawRect(context, metrics, 159 - width, y, width * 2 + 1, 1, "stone", 0.95);
  }

  for (let y = 22; y < 42; y += 5) {
    drawDiode(context, metrics, 151, y, "bright", pulse);
    drawDiode(context, metrics, 167, y, "bright", pulse);
  }
}

function drawSunBackground(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const pulse = 0.28 + Math.sin(frame * 0.18) * 0.1;
  const centerX = 96;
  const centerY = 28;

  // Effet volontairement placé derrière le score : l'information reste prioritaire.
  for (let radius = 5; radius <= 27; radius += 5) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = Math.round(centerX + Math.cos(angle + frame * 0.015) * radius);
      const y = Math.round(centerY + Math.sin(angle + frame * 0.015) * radius * 0.55);
      drawDiode(context, metrics, x, y, "amber", pulse);
    }
  }
}

function drawRubyBackground(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  frame: number,
) {
  const pulse = 0.3 + Math.sin(frame * 0.22) * 0.1;
  const rubyCenters = [
    [78, 29],
    [96, 24],
    [114, 29],
  ] as const;

  rubyCenters.forEach(([centerX, centerY]) => {
    for (let offset = 0; offset <= 8; offset += 1) {
      drawDiode(context, metrics, centerX + offset, centerY - offset, "danger", pulse);
      drawDiode(context, metrics, centerX - offset, centerY - offset, "danger", pulse);
      drawDiode(context, metrics, centerX + offset, centerY + offset, "danger", pulse);
      drawDiode(context, metrics, centerX - offset, centerY + offset, "danger", pulse);
    }
  });
}

function drawMineBackground(
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

    // Animation de l'entrée de mine derrière le score.
    // Elle reste semi-transparente pour ne pas gêner la lecture des points.
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

  // Fallback minimal si la sprite sheet n'est pas encore disponible.
  for (let y = 18; y < 42; y += 4) {
    const width = Math.floor((y - 14) * 1.45);
    drawRect(context, metrics, 96 - width, y, width * 2, 1, "amber", pulse);
  }
}

function drawLiveBackgroundEffect(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
  mineFrames: DmdSpriteFrames,
) {
  if (viewModel.backgroundEffect === "sun") {
    drawSunBackground(context, metrics, frame);
    return;
  }

  if (viewModel.backgroundEffect === "ruby") {
    drawRubyBackground(context, metrics, frame);
    return;
  }

  if (viewModel.backgroundEffect === "mine") {
    drawMineBackground(context, metrics, frame, mineFrames);
  }
}

function drawLives(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  const scale = LIVE_LAYOUT.lives.scale;
  const heartWidth = HEART_PATTERN[0].length * scale;
  const gap = LIVE_LAYOUT.lives.gap;
  const startX =
    MATRIX_WIDTH -
    LIVE_LAYOUT.lives.rightPadding -
    viewModel.maxLives * heartWidth -
    (viewModel.maxLives - 1) * gap;

  for (let index = 0; index < viewModel.maxLives; index += 1) {
    const isActive = index < viewModel.livesRemaining;
    const pulse = 0.82 + Math.sin(frame * 0.18 + index) * 0.12;

    // Une vie perdue garde la même silhouette, mais avec des diodes sombres.
    // Cela permet de comprendre qu'une vie existait à cet emplacement.
    drawPattern(
      context,
      metrics,
      HEART_PATTERN,
      startX + index * (heartWidth + gap),
      LIVE_LAYOUT.lives.y,
      scale,
      isActive ? "danger" : "dim",
      isActive ? pulse : 0.48,
    );

    if (!isActive) {
      drawPattern(
        context,
        metrics,
        HEART_PATTERN,
        startX + index * (heartWidth + gap),
        LIVE_LAYOUT.lives.y,
        scale,
        "stone",
        0.72,
      );
    }
  }
}

function drawClassIcon(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  activeClass: DmdViewModel["activeClass"],
  iconPatterns: DmdIconPatterns,
  frame: number,
) {
  if (!activeClass) {
    return;
  }

  const imagePattern = iconPatterns[activeClass];
  const pattern = imagePattern ?? CLASS_ICON_PATTERNS[activeClass];
  const pulse = 0.68 + Math.sin(frame * 0.16) * 0.12;
  const scale = imagePattern ? 1 : 2;
  const patternWidth = pattern[0].length * scale;
  const patternHeight = pattern.length * scale;
  const iconX = Math.round(LIVE_LAYOUT.classIcon.centerX - patternWidth / 2);
  const iconY = Math.round(LIVE_LAYOUT.classIcon.centerY - patternHeight / 2);

  // Les pictogrammes de classe doivent rester autonomes : pas de libellé,
  // pas de cadre, pour garder l'écran proche d'un vrai DMD de flipper.
  drawPattern(context, metrics, pattern, iconX, iconY, scale, "amber", pulse);
}

function drawScore(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  scoreImpact: number,
  isMineAnimationActive = false,
) {
  const hasImpact = scoreImpact > 0;
  const preferredScale = isMineAnimationActive
    ? LIVE_LAYOUT.score.minePreferredScale
    : hasImpact
      ? 5
      : 4;
  const scale = fitTextScale(
    viewModel.scoreText,
    preferredScale,
    isMineAnimationActive
      ? LIVE_LAYOUT.score.mineMaxWidth
      : LIVE_LAYOUT.score.maxWidth,
  );
  const scoreWidth = measureBitmapText(viewModel.scoreText, scale);
  const x = Math.round(LIVE_LAYOUT.score.centerX - scoreWidth / 2);
  const y = isMineAnimationActive
    ? LIVE_LAYOUT.score.mineY
    : hasImpact
      ? LIVE_LAYOUT.score.impactY
      : LIVE_LAYOUT.score.normalY;

  // Un seul score est dessiné par frame : l'impact vient de la taille/couleur,
  // pas d'un second score fantôme qui se superpose à l'arrière-plan.
  // Pendant l'animation mine, le score se met en haut et libère la zone centrale.
  drawBitmapText(
    context,
    metrics,
    viewModel.scoreText,
    x,
    y,
    scale,
    hasImpact ? "bright" : "amber",
    0.94,
  );
}

function drawMultiplierTrack(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  if (viewModel.isSunBonusActive) {
    const pulse = 0.82 + Math.sin(frame * 0.26) * 0.16;

    // Le x50 est rare : il remplace toute la ligne de multiplicateurs.
    drawCenteredTextInBox(
      context,
      metrics,
      "X50",
      LIVE_LAYOUT.score.centerX,
      LIVE_LAYOUT.multipliers.x50Y,
      3,
      LIVE_LAYOUT.multipliers.x50MaxWidth,
      "bright",
      pulse,
    );
    return;
  }

  viewModel.availableMultipliers.forEach((multiplier, index) => {
    const slotX = LIVE_LAYOUT.multipliers.slots[index];

    if (slotX === undefined) {
      return;
    }

    const isActive = viewModel.activeMultipliers.includes(multiplier);
    const label = `X${multiplier}`;

    // Les multiplicateurs inactifs restent visibles en sombre pour rappeler
    // les objectifs encore disponibles sans voler l'attention au score.
    drawCenteredTextInBox(
      context,
      metrics,
      label,
      slotX,
      LIVE_LAYOUT.multipliers.slotY,
      1,
      LIVE_LAYOUT.multipliers.maxWidth,
      isActive ? "bright" : "dim",
      isActive ? 0.95 : 0.45,
    );

    drawRect(
      context,
      metrics,
      slotX - LIVE_LAYOUT.multipliers.underlineWidth / 2,
      LIVE_LAYOUT.multipliers.underlineY,
      LIVE_LAYOUT.multipliers.underlineWidth,
      1,
      isActive ? "amber" : "stone",
      isActive ? 0.9 : 0.75,
    );
  });
}

function drawLiveEventMessage(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  const message = viewModel.eventMessage || viewModel.subline;

  // Un message trop long défile au lieu d'être réduit jusqu'à devenir illisible.
  if (measureBitmapText(message, 1) > LIVE_LAYOUT.message.scrollThreshold) {
    drawScrollingText(context, metrics, message, LIVE_LAYOUT.message.y, frame);
    return;
  }

  drawCenteredTextInBox(
    context,
    metrics,
    message,
    LIVE_LAYOUT.message.centerX,
    LIVE_LAYOUT.message.y,
    1,
    LIVE_LAYOUT.message.maxWidth,
    "bright",
    0.88,
  );
}

function drawRubyIndicators(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
) {
  viewModel.rubiesActive.forEach((isActive, index) => {
    drawRect(
      context,
      metrics,
      86 + index * 7,
      57,
      4,
      3,
      isActive ? "bright" : "dim",
      isActive ? 1 : 0.55,
    );
  });
}

function drawStatusRails(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
) {
  drawBitmapText(context, metrics, viewModel.footerLeft, 4, 4, 1, "amber", 0.9);
  drawRightAlignedText(
    context,
    metrics,
    viewModel.footerRight,
    MATRIX_WIDTH - 4,
    4,
    1,
    "amber",
    0.9,
  );
  drawRubyIndicators(context, metrics, viewModel);
}

function drawLiveScore(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  iconPatterns: DmdIconPatterns,
  mineFrames: DmdSpriteFrames,
  frame: number,
  scoreImpact: number,
) {
  const isMineAnimationActive = viewModel.backgroundEffect === "mine";

  // Ordre de dessin important :
  // 1. effets de fond, 2. infos persistantes, 3. score, 4. messages.
  // Ainsi le score reste toujours lisible au-dessus des animations.
  drawLiveBackgroundEffect(context, metrics, viewModel, frame, mineFrames);
  drawBitmapText(
    context,
    metrics,
    viewModel.playerToken,
    LIVE_LAYOUT.playerToken.x,
    LIVE_LAYOUT.playerToken.y,
    LIVE_LAYOUT.playerToken.scale,
    "danger",
    0.9,
  );
  drawLives(context, metrics, viewModel, frame);
  drawClassIcon(context, metrics, viewModel.activeClass, iconPatterns, frame);
  drawScore(context, metrics, viewModel, scoreImpact, isMineAnimationActive);

  // L'animation mine occupe temporairement la zone centrale/basse.
  // On masque donc multiplicateurs et message pour éviter toute superposition.
  if (isMineAnimationActive) {
    return;
  }

  drawMultiplierTrack(context, metrics, viewModel, frame);
  drawLiveEventMessage(context, metrics, viewModel, frame);
}

function drawClaimScene(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  const headlineTone = viewModel.accent === "danger" ? "danger" : "bright";
  const scrollText =
    viewModel.id === "claim-claim_pending"
      ? "REJOINS LA GUILDE"
      : "QUETE CONSIGNEE";

  // Le DMD ne montre jamais le QR code : il garde une scène d'attente lisible,
  // pendant que le backglass ou le mobile portent l'action de scan.
  drawBitmapText(context, metrics, viewModel.footerLeft, 9, 6, 1, "amber", 0.92);
  drawRightAlignedText(
    context,
    metrics,
    viewModel.scoreText,
    MATRIX_WIDTH - 9,
    6,
    1,
    "bright",
    0.92,
  );
  drawTorch(context, metrics, 12, 24, frame);
  drawTorch(context, metrics, 174, 24, frame + 12);
  drawClaimSeal(context, metrics, 36, 32, frame);
  drawClaimArch(context, metrics, frame);
  drawCenteredText(context, metrics, viewModel.headline, 23, 2, headlineTone);
  drawCenteredText(context, metrics, viewModel.subline, 43, 1, "amber");
  drawScrollingText(context, metrics, scrollText, 55, frame);
}

function drawMessageScene(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
) {
  const tone = viewModel.accent === "danger" ? "danger" : "bright";

  drawStatusRails(context, metrics, viewModel);
  drawCenteredText(context, metrics, viewModel.kicker, 15, 1, "amber");
  drawCenteredText(context, metrics, viewModel.headline, 25, 3, tone);
  drawCenteredText(context, metrics, viewModel.subline, 48, 1, "amber");
}

function drawGameOverScene(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  drawGameOverExplosion(context, metrics, frame);

  // GAME OVER doit dominer l'écran de fin : rouge, centré, et sans décor
  // concurrent direct devant lui.
  drawCenteredTextInBox(
    context,
    metrics,
    "GAME OVER",
    SCENE_LAYOUT.gameOver.centerX,
    SCENE_LAYOUT.gameOver.headlineY,
    4,
    MATRIX_WIDTH - 18,
    "danger",
    0.96,
  );
  drawCenteredTextInBox(
    context,
    metrics,
    `SCORE ${viewModel.scoreText}`,
    SCENE_LAYOUT.gameOver.centerX,
    SCENE_LAYOUT.gameOver.scoreY,
    2,
    MATRIX_WIDTH - 18,
    "bright",
    0.9,
  );
}

function drawAttractScene(
  context: CanvasRenderingContext2D,
  metrics: RenderMetrics,
  viewModel: DmdViewModel,
  frame: number,
) {
  drawCoinPromptOrnament(context, metrics, frame);
  drawCenteredTextInBox(
    context,
    metrics,
    "INSERT",
    SCENE_LAYOUT.attract.coinCenterX,
    SCENE_LAYOUT.attract.headlineY,
    2,
    MATRIX_WIDTH - 20,
    "bright",
    0.92,
  );
  drawCenteredTextInBox(
    context,
    metrics,
    "COIN",
    SCENE_LAYOUT.attract.coinCenterX,
    SCENE_LAYOUT.attract.headlineY + 15,
    2,
    MATRIX_WIDTH - 20,
    "amber",
    0.9,
  );
  drawScrollingText(context, metrics, viewModel.subline, SCENE_LAYOUT.attract.scrollY, frame);
}

function renderFrame(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  viewModel: DmdViewModel,
  iconPatterns: DmdIconPatterns,
  mineFrames: DmdSpriteFrames,
  frame: number,
  scoreImpact: number,
) {
  const metrics = getMetrics(canvas);

  drawBackgroundGrid(context, canvas, metrics);

  // Le DMD choisit une seule scène par frame.
  // Attract et score-claim ont priorité sur l'affichage live classique.
  if (viewModel.isAttractMode) {
    drawAttractScene(context, metrics, viewModel, frame);
    return;
  }

  if (viewModel.mode === "score-claim") {
    drawClaimScene(context, metrics, viewModel, frame);
    return;
  }

  if (viewModel.mode === "game-over") {
    drawGameOverScene(context, metrics, viewModel, frame);
    return;
  }

  if (viewModel.mode === "live") {
    drawLiveScore(
      context,
      metrics,
      viewModel,
      iconPatterns,
      mineFrames,
      frame,
      scoreImpact,
    );
    return;
  }

  drawMessageScene(context, metrics, viewModel);
}

export default function DungeonDragonDmdDisplay({
  viewModel,
}: DungeonDragonDmdDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const latestViewModelRef = useRef(viewModel);
  const previousScoreRef = useRef(viewModel.currentScore);
  const scoreImpactRef = useRef(0);
  const iconPatternsRef = useRef<DmdIconPatterns>({});
  const mineFramesRef = useRef<DmdSpriteFrames>([]);

  useEffect(() => {
    // Quand le score augmente, on déclenche un court impact visuel.
    // Le score est toujours redessiné une seule fois par frame pour éviter l'effet fantôme.
    if (viewModel.currentScore > previousScoreRef.current) {
      const scoreDelta = viewModel.currentScore - previousScoreRef.current;
      scoreImpactRef.current = Math.min(18, 8 + Math.ceil(scoreDelta / 500));
    }

    previousScoreRef.current = viewModel.currentScore;
    latestViewModelRef.current = viewModel;
  }, [viewModel]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = getCanvasContext(canvas);

    if (!context) {
      return;
    }

    let animationFrameId = 0;
    let lastFrameTime = 0;
    let isMounted = true;

    // Chargement asynchrone des pictogrammes de classe.
    // Le fallback codé en dur reste affiché tant que l'image n'est pas prête.
    Object.entries(CLASS_ICON_IMAGE_SOURCES).forEach(([className, source]) => {
      if (!source) {
        return;
      }

      const classIcon = className as ClassIcon;

      void rasterizeImageToDmdPattern(source, CLASS_ICON_SIZE, CLASS_ICON_SIZE)
        .then((pattern) => {
          if (!pattern || !isMounted) {
            return;
          }

          iconPatternsRef.current = {
            ...iconPatternsRef.current,
            [classIcon]: pattern,
          };
        })
        .catch((error) => {
          console.error(error);
        });
    });

    // Chargement de l'animation mine : une sprite sheet horizontale de 16 frames.
    // Chaque frame est convertie une fois en motif DMD 64x48 afin d'avoir du binaire
    void rasterizeSpriteSheetToDmdFrames(
      MINE_OPENING_SPRITE_URL,
      MINE_SPRITE_FRAME_WIDTH,
      MINE_SPRITE_FRAME_HEIGHT,
      MINE_SPRITE_FRAME_COUNT,
    )
      .then((frames) => {
        if (!frames || !isMounted) {
          return;
        }

        mineFramesRef.current = frames;
      })
      .catch((error) => {
        console.error(error);
      });

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
    };

    const draw = (time: number) => {
      animationFrameId = window.requestAnimationFrame(draw);

      // Limite volontairement le rendu à 60 FPS : suffisant pour un DMD,
      // et moins coûteux pendant que le playfield Three.js tourne.
      if (time - lastFrameTime < 1000 / FRAME_RATE) {
        return;
      }

      lastFrameTime = time;
      frameRef.current += 1;
      renderFrame(
        context,
        canvas,
        latestViewModelRef.current,
        iconPatternsRef.current,
        mineFramesRef.current,
        frameRef.current,
        scoreImpactRef.current,
      );
      scoreImpactRef.current = Math.max(0, scoreImpactRef.current - 1);
    };

    // Le canvas s'adapte au viewport 1920x1080 cible sans recréer de DOM par diode.
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    animationFrameId = window.requestAnimationFrame(draw);

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
<main className="h-screen w-screen overflow-hidden bg-[#060403] text-[#e6dcc8]">
  <section className="h-full w-full">
    <div className="relative h-full w-full overflow-hidden bg-[#24170f]">
      <canvas
        aria-label={`${viewModel.headline} ${viewModel.subline}`}
        className="h-full w-full bg-[#050403]"
        ref={canvasRef}
      />
    </div>
  </section>
</main>
  );
}
