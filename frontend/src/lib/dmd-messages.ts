import { getScoreClaimDmdMessage } from "./score-claim-copy";
import type { AppMode } from "./app-mode";
import type { ScoreClaimSessionSnapshot } from "./score-claim-session-store";

export type DmdPriority = "P0" | "P1" | "P2" | "P3";

export type DmdAccent = "neutral" | "quest" | "reward" | "danger" | "claim";

export type DmdMessageMode = "attract" | "game-over" | "live" | "score-claim";

export type DmdClassIcon = "warrior" | "elf" | "necromancer" | "dwarf" | null;

export type DmdBackgroundEffect = "none" | "ruby" | "sun" | "mine";

export type DmdViewModel = {
  accent: DmdAccent;
  activePlayerLabel: string;
  activeClass: DmdClassIcon;
  activeMultipliers: number[];
  appMode: AppMode;
  availableMultipliers: number[];
  ballsText: string;
  backgroundEffect: DmdBackgroundEffect;
  currentBalls: number;
  currentScore: number;
  eventMessage: string;
  footerLeft: string;
  footerRight: string;
  headline: string;
  id: string;
  isAttractMode: boolean;
  isSunBonusActive: boolean;
  kicker: string;
  kickbacksText: string;
  livesRemaining: number;
  maxLives: number;
  mineText: string;
  mode: DmdMessageMode;
  multiplierText: string;
  playerCount: number;
  playerToken: string;
  priority: DmdPriority;
  rubiesActive: [boolean, boolean, boolean];
  scoreText: string;
  subline: string;
};

export type BuildDmdViewModelInput = {
  activeClass?: DmdClassIcon;
  activeMultipliers?: number[];
  appMode: AppMode;
  attractStep?: number;
  ballInLauncher: boolean;
  ballsRemaining: number[];
  backgroundEffect?: DmdBackgroundEffect;
  currentPlayerIndex: number;
  forceGameOver?: boolean;
  isSunBonusActive?: boolean;
  isPlaying: boolean;
  leftKickbackActive: boolean;
  mineHits: number;
  playerCount: number;
  rightKickbackActive: boolean;
  rubiesActive: [boolean, boolean, boolean];
  scoreClaimSnapshot?: ScoreClaimSessionSnapshot;
  scoreMultiplier: number;
  scores: number[];
  screenMessage: string | null;
};

const AVAILABLE_MULTIPLIERS = [2, 6, 8, 12] as const;
const MAX_LIVES = 3;

const ATTRACT_MESSAGES = [
  {
    headline: "INSERER UNE MONNAIE",
    subline: "POUR COMMENCER LA PARTIE",
  },
] as const;

// Le DMD reçoit parfois un index joueur provenant d'un état partagé.
// On le borne ici pour éviter qu'un écran secondaire casse si le store est temporairement désynchronisé.
function clampIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), length - 1);
}

// Le score-claim possède déjà ses propres libellés canoniques.
// Ce type guard permet de les prioriser sans dupliquer la logique du flow mobile/backglass.
function hasScoreClaimMessage(
  snapshot: ScoreClaimSessionSnapshot | undefined,
): snapshot is ScoreClaimSessionSnapshot {
  if (snapshot === undefined || snapshot.phase === "idle") {
    return false;
  }

  // Une erreur isolée peut rester en localStorage après un test ou un backend indisponible.
  // Sans partie sauvegardée ni claim réel, elle ne doit pas masquer l'accueil ou GAME OVER.
  if (snapshot.phase === "error" && !snapshot.game && !snapshot.claim) {
    return false;
  }

  return true;
}

function getMockClassIcon(activePlayerIndex: number): DmdClassIcon {
  const classes: NonNullable<DmdClassIcon>[] = [
    "warrior",
    "elf",
    "necromancer",
    "dwarf",
  ];

  return classes[activePlayerIndex % classes.length];
}

function getScoreClaimDmdSubline(snapshot: ScoreClaimSessionSnapshot) {
  switch (snapshot.phase) {
    case "submitting":
      return "GRIMOIRE OUVERT";
    case "discarded":
      return "RETOUR AU DONJON";
    case "saved":
      return "GRIMOIRE SCELLE";
    case "claim_pending":
      return "HEROS EN ATTENTE";
    case "claim_approved":
      return "HEROS IDENTIFIE";
    case "claim_expired":
      return "PORTAIL FERME";
    case "error":
      return "RITUEL INTERROMPU";
    case "idle":
      return "FIN DE QUETE";
  }
}

// La rotation d'attract mode reste déterministe pour être testable.
// La page DMD ne fait qu'incrémenter attractStep avec un timer.
function getAttractMessage(step: number) {
  const index = Math.abs(Math.trunc(step)) % ATTRACT_MESSAGES.length;
  return ATTRACT_MESSAGES[index];
}

function getActiveMultipliersFromScoreMultiplier(scoreMultiplier: number) {
  const safeMultiplier = Math.max(1, scoreMultiplier);

  return AVAILABLE_MULTIPLIERS.filter((multiplier) => safeMultiplier >= multiplier);
}

function getMultiplierMessage(
  activeMultipliers: number[],
  isSunBonusActive: boolean,
) {
  if (isSunBonusActive) {
    return "NAT 20 - DRAGON AWAKES";
  }

  const highestMultiplier = Math.max(1, ...activeMultipliers);

  if (highestMultiplier >= 12) {
    return "CRITICAL BLESSING";
  }

  if (highestMultiplier >= 8) {
    return "ARCANE SURGE";
  }

  if (highestMultiplier >= 6) {
    return "THE PARTY RALLIES";
  }

  if (highestMultiplier >= 2) {
    return "ADVANTAGE GAINED";
  }

  return "ROLL FOR INITIATIVE";
}

function isRubyBonusMessage(screenMessage: string | null) {
  return screenMessage ? /rubis|ruby/i.test(screenMessage) : false;
}

function getBackgroundEffect({
  backgroundEffect,
  isSunBonusActive,
  rubiesActive,
  screenMessage,
}: {
  backgroundEffect: DmdBackgroundEffect | undefined;
  isSunBonusActive: boolean;
  rubiesActive: [boolean, boolean, boolean];
  screenMessage: string | null;
}): DmdBackgroundEffect {
  if (backgroundEffect) {
    return backgroundEffect;
  }

  if (isSunBonusActive) {
    return "sun";
  }

  if (rubiesActive.every(Boolean) || isRubyBonusMessage(screenMessage)) {
    return "ruby";
  }

  if (screenMessage && /mine/i.test(screenMessage)) {
    return "mine";
  }

  return "none";
}

export function formatDmdScore(score: number) {
  const safeScore = Math.max(0, Math.trunc(score));
  return safeScore.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function getPlayerLabel(currentPlayerIndex: number) {
  return `PLAYER ${Math.max(1, currentPlayerIndex + 1)}`;
}

export function getBallLabel(currentBalls: number) {
  return `BALL ${Math.max(0, currentBalls)}`;
}

// Cette fonction est volontairement pure : elle transforme l'état du jeu en modèle d'affichage.
// Le composant React peut donc rester simple et les règles de priorité sont testables sans navigateur.
export function buildDmdViewModel({
  activeClass,
  activeMultipliers: providedActiveMultipliers,
  appMode,
  attractStep = 0,
  ballInLauncher,
  ballsRemaining,
  backgroundEffect: providedBackgroundEffect,
  currentPlayerIndex,
  forceGameOver = false,
  isSunBonusActive: providedIsSunBonusActive,
  isPlaying,
  leftKickbackActive,
  mineHits,
  playerCount,
  rightKickbackActive,
  rubiesActive,
  scoreClaimSnapshot,
  scoreMultiplier,
  scores,
  screenMessage,
}: BuildDmdViewModelInput): DmdViewModel {
  const safePlayerCount = Math.max(1, playerCount);
  const activePlayerIndex = clampIndex(currentPlayerIndex, safePlayerCount);
  const currentScore = scores[activePlayerIndex] ?? 0;
  const currentBalls = ballsRemaining[activePlayerIndex] ?? 0;
  const activePlayerLabel = getPlayerLabel(activePlayerIndex);
  const playerToken = `P${activePlayerIndex + 1}`;
  const ballsText = getBallLabel(currentBalls);
  const scoreText = formatDmdScore(currentScore);
  const multiplierText = `X${Math.max(1, scoreMultiplier)}`;
  const mineText = `MINE ${Math.max(0, mineHits)}/3`;
  const litRubies = rubiesActive.filter(Boolean).length;
  const activeMultipliers =
    providedActiveMultipliers ??
    getActiveMultipliersFromScoreMultiplier(scoreMultiplier);
  const isSunBonusActive =
    providedIsSunBonusActive ?? Math.max(1, scoreMultiplier) >= 50;
  const backgroundEffect = getBackgroundEffect({
    backgroundEffect: providedBackgroundEffect,
    isSunBonusActive,
    rubiesActive,
    screenMessage,
  });
  const eventMessage =
    screenMessage ??
    (ballInLauncher ? "TIRER LE PLUNGER" : getMultiplierMessage(activeMultipliers, isSunBonusActive));
  const maxLives = MAX_LIVES;
  const livesRemaining = Math.min(Math.max(0, currentBalls), maxLives);
  const classIcon = activeClass ?? getMockClassIcon(activePlayerIndex);
  const kickbacksText = [
    leftKickbackActive ? "L-KICK" : "L-OUT",
    rightKickbackActive ? "R-KICK" : "R-OUT",
  ].join(" / ");
  const baseFooterLeft = `${activePlayerLabel} - ${ballsText}`;
  const baseFooterRight = `${multiplierText} - RUNES ${litRubies}/3`;

  // Priorité haute : si le score-claim est actif, le DMD informe le joueur
  // sans afficher le QR code, qui reste réservé au backglass ou au mobile.
  if (!isPlaying && hasScoreClaimMessage(scoreClaimSnapshot)) {
    const claimSnapshot = scoreClaimSnapshot;
    const claimScore = claimSnapshot.game?.finalScore ?? currentScore;
    const claimHeadline =
      getScoreClaimDmdMessage(claimSnapshot) ||
      (claimSnapshot.phase === "error" ? "CLAIM ERROR" : "GAME OVER");

    return {
      accent: claimSnapshot.phase === "error" ? "danger" : "claim",
      activePlayerLabel,
      activeClass: classIcon,
      activeMultipliers,
      appMode,
      availableMultipliers: [...AVAILABLE_MULTIPLIERS],
      ballsText,
      backgroundEffect: "none",
      currentBalls,
      currentScore,
      eventMessage: getScoreClaimDmdSubline(claimSnapshot),
      footerLeft: "HALL DES HEROS",
      footerRight: formatDmdScore(claimScore),
      headline: claimHeadline,
      id: `claim-${claimSnapshot.phase}`,
      isAttractMode: false,
      isSunBonusActive: false,
      kicker: "RELIQUE SAUVEE",
      kickbacksText,
      livesRemaining,
      maxLives,
      mineText,
      mode: "score-claim",
      multiplierText,
      playerCount: safePlayerCount,
      playerToken,
      priority: "P1",
      rubiesActive,
      scoreText: formatDmdScore(claimScore),
      subline: getScoreClaimDmdSubline(claimSnapshot),
    };
  }

  // Hors partie, GAME OVER doit être un état transitoire déclenché explicitement
  // par la page DMD au moment exact où `isPlaying` passe de true à false.
  // Sans ce signal, l'écran retombe vers l'accueil même si un ancien score
  // reste encore dans le store.
  if (!isPlaying) {
    if (forceGameOver) {
      return {
        accent: "danger",
        activePlayerLabel,
        activeClass: classIcon,
        activeMultipliers,
        appMode,
        availableMultipliers: [...AVAILABLE_MULTIPLIERS],
        ballsText,
        backgroundEffect: "none",
        currentBalls,
        currentScore,
        eventMessage: "THE QUEST ENDS",
        footerLeft: "FINAL SCORE",
        footerRight: `${safePlayerCount} PLAYER${safePlayerCount > 1 ? "S" : ""}`,
        headline: "GAME OVER",
        id: "game-over",
        isAttractMode: false,
        isSunBonusActive: false,
        kicker: "FIN DE QUETE",
        kickbacksText,
        livesRemaining: 0,
        maxLives,
        mineText,
        mode: "game-over",
        multiplierText,
        playerCount: safePlayerCount,
        playerToken,
        priority: "P0",
        rubiesActive,
        scoreText,
        subline: scoreText,
      };
    }

    const attractMessage = getAttractMessage(attractStep);
    return {
      accent: "neutral",
      activePlayerLabel,
      activeClass: null,
      activeMultipliers: [],
      appMode,
      availableMultipliers: [...AVAILABLE_MULTIPLIERS],
      ballsText,
      backgroundEffect: "none",
      currentBalls,
      currentScore,
      eventMessage: attractMessage.subline,
      footerLeft: "ATTRACT MODE",
      footerRight: appMode.toUpperCase(),
      headline: attractMessage.headline,
      id: `attract-${Math.abs(Math.trunc(attractStep)) % ATTRACT_MESSAGES.length}`,
      isAttractMode: true,
      isSunBonusActive: false,
      kicker: "PINBALL THREE",
      kickbacksText,
      livesRemaining: maxLives,
      maxLives,
      mineText,
      mode: "attract",
      multiplierText,
      playerCount: safePlayerCount,
      playerToken,
      priority: "P3",
      rubiesActive,
      scoreText,
      subline: attractMessage.subline,
    };
  }

  // Quand la bille est au lanceur, le DMD pousse l'action immédiate attendue du joueur.
  if (ballInLauncher) {
    return {
      accent: "quest",
      activePlayerLabel,
      activeClass: classIcon,
      activeMultipliers,
      appMode,
      availableMultipliers: [...AVAILABLE_MULTIPLIERS],
      ballsText,
      backgroundEffect,
      currentBalls,
      currentScore,
      eventMessage,
      footerLeft: baseFooterLeft,
      footerRight: baseFooterRight,
      headline: scoreText,
      id: "ball-ready",
      isAttractMode: false,
      isSunBonusActive,
      kicker: "PLUNGER",
      kickbacksText,
      livesRemaining,
      maxLives,
      mineText,
      mode: "live",
      multiplierText,
      playerCount: safePlayerCount,
      playerToken,
      priority: "P2",
      rubiesActive,
      scoreText,
      subline: eventMessage,
    };
  }

  // Affichage stable par défaut pendant la partie : score, joueur, bille et multiplicateur.
  return {
    accent: scoreMultiplier > 1 ? "reward" : "neutral",
    activePlayerLabel,
    activeClass: classIcon,
    activeMultipliers,
    appMode,
    availableMultipliers: [...AVAILABLE_MULTIPLIERS],
    ballsText,
    backgroundEffect,
    currentBalls,
    currentScore,
    eventMessage,
    footerLeft: baseFooterLeft,
    footerRight: baseFooterRight,
    headline: scoreText,
    id: "live-score",
    isAttractMode: false,
    isSunBonusActive,
    kicker: activePlayerLabel,
    kickbacksText,
    livesRemaining,
    maxLives,
    mineText,
    mode: "live",
    multiplierText,
    playerCount: safePlayerCount,
    playerToken,
    priority: "P3",
    rubiesActive,
    scoreText,
    subline: eventMessage,
  };
}
