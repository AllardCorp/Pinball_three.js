import { getScoreClaimDmdMessage } from "./score-claim-copy";
import type { AppMode } from "./app-mode";
import type { ScoreClaimSessionSnapshot } from "./score-claim-session-store";
import type {
  MultiplierSource,
  PlayerClass,
} from "@/config/gameBalancingConfig";
import { MULTIPLIERS_CONFIG } from "@/config/gameBalancingConfig";

export type DmdPriority = "P0" | "P1" | "P2" | "P3";
export type DmdAccent = "neutral" | "quest" | "reward" | "danger" | "claim";
export type DmdMessageMode = "attract" | "game-over" | "live" | "score-claim";
export type DmdClassIcon = "warrior" | "elf" | "necromancer" | "dwarf" | null;
export type DmdBackgroundEffect = "none" | "ruby" | "sun" | "mine";

export type DmdMultiplierSnapshot = Partial<
  Record<MultiplierSource, { value: number; expiresAt: number; totalDuration: number }>
>;

export type DmdMultiplierSlot = {
  active: boolean;
  label: `X${number}`;
  value: number;
};

export type DmdViewModel = {
  accent: DmdAccent;
  activeClass: DmdClassIcon;
  activePlayerLabel: string;
  appMode: AppMode;
  backgroundEffect: DmdBackgroundEffect;
  currentBalls: number;
  currentMultiplier: number;
  currentScore: number;
  eventMessage: string;
  footerLeft: string;
  footerRight: string;
  headline: string;
  id: string;
  isAttractMode: boolean;
  isSunBonusActive: boolean;
  kicker: string;
  livesRemaining: number;
  maxLives: number;
  mineText: string;
  mode: DmdMessageMode;
  multiplierSlots: DmdMultiplierSlot[];
  playerCount: number;
  playerToken: string;
  priority: DmdPriority;
  rubiesActive: [boolean, boolean, boolean];
  scoreText: string;
  subline: string;
};

export type BuildDmdViewModelInput = {
  activeClass: PlayerClass;
  activeMultipliers: DmdMultiplierSnapshot;
  appMode: AppMode;
  attractStep?: number;
  ballInLauncher: boolean;
  ballsRemaining: number[];
  currentPlayerIndex: number;
  forceGameOver?: boolean;
  isPlaying: boolean;
  isPowerOnCooldown: boolean;
  isUndeathActive: boolean;
  mineHits: number;
  playerCount: number;
  rubyAnimationVisible: boolean;
  rubiesActive: [boolean, boolean, boolean];
  scoreClaimSnapshot?: ScoreClaimSessionSnapshot;
  scores: number[];
  screenMessage: string | null;
  swordActive: boolean;
};

const MULTIPLIER_SLOT_VALUES = [2, 4, 6, 8, 12] as const;
const MAX_LIVES = 3;

const ATTRACT_MESSAGES = [
  {
    headline: "le donjon vous attend",
    subline: "Commencez une partie !",
  },
] as const;

const CLASS_ICON_BY_CLASS: Record<PlayerClass, DmdClassIcon> = {
  Dwarf: "dwarf",
  Elf: "elf",
  Necromancer: "necromancer",
  None: null,
  Warrior: "warrior",
};

const FRENCH_TEXT_REPLACEMENTS: Record<string, string> = {
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

function normalizeSearchText(text: string) {
  return [...text.toLowerCase()]
    .map((character) => FRENCH_TEXT_REPLACEMENTS[character] ?? character)
    .join("");
}

function clampIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), length - 1);
}

function hasScoreClaimMessage(
  snapshot: ScoreClaimSessionSnapshot | undefined,
): snapshot is ScoreClaimSessionSnapshot {
  if (!snapshot || snapshot.phase === "idle") {
    return false;
  }

  // Une ancienne erreur isolée ne doit pas bloquer l'accueil du DMD.
  return snapshot.phase !== "error" || Boolean(snapshot.game || snapshot.claim);
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

function getAttractMessage(step: number) {
  const index = Math.abs(Math.trunc(step)) % ATTRACT_MESSAGES.length;
  return ATTRACT_MESSAGES[index];
}

function getActiveMultiplierEntries(activeMultipliers: DmdMultiplierSnapshot) {
  const now = Date.now();

  return Object.entries(activeMultipliers).filter((entry): entry is [
    MultiplierSource,
    { value: number; expiresAt: number; totalDuration: number },
  ] => {
    const [, data] = entry;
    return Boolean(data && data.expiresAt > now);
  });
}

function getCurrentMultiplier(activeMultipliers: DmdMultiplierSnapshot) {
  return Math.max(
    1,
    ...getActiveMultiplierEntries(activeMultipliers).map(([, data]) => data.value),
  );
}

function buildMultiplierSlots(activeMultipliers: DmdMultiplierSnapshot) {
  const activeValues = new Set(
    getActiveMultiplierEntries(activeMultipliers)
      .filter(([source]) => source !== "sunBonus")
      .map(([, data]) => data.value),
  );

  return MULTIPLIER_SLOT_VALUES.map((value) => ({
    active: activeValues.has(value),
    label: `X${value}` as const,
    value,
  }));
}

function hasActiveMultiplier(
  activeMultipliers: DmdMultiplierSnapshot,
  source: MultiplierSource,
) {
  const multiplier = activeMultipliers[source];
  return Boolean(multiplier && multiplier.expiresAt > Date.now());
}

function getMultiplierMessage(currentMultiplier: number, isSunBonusActive: boolean) {
  if (isSunBonusActive) {
    return "20 NATUREL - DRAGON EVEILLE";
  }

  if (currentMultiplier >= 12) {
    return "BENEDICTION CRITIQUE";
  }

  if (currentMultiplier >= 8) {
    return "AFFLUX ARCANIQUE";
  }

  if (currentMultiplier >= 6) {
    return "LE GROUPE SE RASSEMBLE";
  }

  if (currentMultiplier >= 2) {
    return "AVANTAGE GAGNE";
  }

  return "";
}

function isMineMessage(screenMessage: string | null) {
  return screenMessage ? screenMessage.toLowerCase().includes("mine") : false;
}

function isRubyMessage(screenMessage: string | null) {
  if (!screenMessage) {
    return false;
  }

  const normalizedMessage = normalizeSearchText(screenMessage);

  return ["rubis", "ruby", "rune", "tresor"].some((keyword) =>
    normalizedMessage.includes(keyword),
  );
}

function getBackgroundEffect({
  activeMultipliers,
  isSunBonusActive,
  rubyAnimationVisible,
  screenMessage,
}: {
  activeMultipliers: DmdMultiplierSnapshot;
  isSunBonusActive: boolean;
  rubyAnimationVisible: boolean;
  screenMessage: string | null;
}): DmdBackgroundEffect {
  if (isSunBonusActive) {
    return "sun";
  }

  if (
    rubyAnimationVisible &&
    (hasActiveMultiplier(activeMultipliers, "gems") || isRubyMessage(screenMessage))
  ) {
    return "ruby";
  }

  if (isMineMessage(screenMessage)) {
    return "mine";
  }

  return "none";
}

function getLiveMessage({
  ballInLauncher,
  currentMultiplier,
  isPowerOnCooldown,
  isSunBonusActive,
  screenMessage,
  swordActive,
}: {
  ballInLauncher: boolean;
  currentMultiplier: number;
  isPowerOnCooldown: boolean;
  isSunBonusActive: boolean;
  screenMessage: string | null;
  swordActive: boolean;
}) {
  if (screenMessage) {
    return screenMessage;
  }

  if (ballInLauncher) {
    return "TIREZ LE LANCEUR";
  }

  if (swordActive) {
    return "UNE EPEE EST APPARUE";
  }

  if (isPowerOnCooldown) {
    return "POUVOIR EN RECHARGE";
  }

  return getMultiplierMessage(currentMultiplier, isSunBonusActive);
}

export function formatDmdScore(score: number) {
  const safeScore = Math.max(0, Math.trunc(score));
  const digits = safeScore.toString();
  const groups: string[] = [];

  // On groupe manuellement par milliers pour garder une logique lisible
  // pendant la soutenance, sans dépendre d'une expression régulière dense.
  for (let index = digits.length; index > 0; index -= 3) {
    const start = Math.max(0, index - 3);
    groups.unshift(digits.slice(start, index));
  }

  return groups.join(" ");
}

export function getPlayerLabel(currentPlayerIndex: number) {
  return `JOUEUR ${Math.max(1, currentPlayerIndex + 1)}`;
}

export function getBallLabel(currentBalls: number) {
  return `BILLE ${Math.max(0, currentBalls)}`;
}

export function buildDmdViewModel({
  activeClass,
  activeMultipliers,
  appMode,
  attractStep = 0,
  ballInLauncher,
  ballsRemaining,
  currentPlayerIndex,
  forceGameOver = false,
  isPlaying,
  isPowerOnCooldown,
  isUndeathActive,
  mineHits,
  playerCount,
  rubyAnimationVisible,
  rubiesActive,
  scoreClaimSnapshot,
  scores,
  screenMessage,
  swordActive,
}: BuildDmdViewModelInput): DmdViewModel {
  const safePlayerCount = Math.max(1, playerCount);
  const activePlayerIndex = clampIndex(currentPlayerIndex, safePlayerCount);
  const currentScore = scores[activePlayerIndex] ?? 0;
  const currentBalls = ballsRemaining[activePlayerIndex] ?? 0;
  const currentMultiplier = getCurrentMultiplier(activeMultipliers);
  const isSunBonusActive =
    isUndeathActive || hasActiveMultiplier(activeMultipliers, "sunBonus");
  const backgroundEffect = getBackgroundEffect({
    activeMultipliers,
    isSunBonusActive,
    rubyAnimationVisible,
    screenMessage,
  });
  const multiplierSlots = buildMultiplierSlots(activeMultipliers);
  const activePlayerLabel = getPlayerLabel(activePlayerIndex);
  const playerToken = `P${activePlayerIndex + 1}`;
  const ballsText = getBallLabel(currentBalls);
  const scoreText = formatDmdScore(currentScore);
  const mineText = `MINE ${Math.max(0, mineHits)}/3`;
  const eventMessage = getLiveMessage({
    ballInLauncher,
    currentMultiplier,
    isPowerOnCooldown,
    isSunBonusActive,
    screenMessage,
    swordActive,
  });
  const maxLives = MAX_LIVES;
  const livesRemaining = Math.min(Math.max(0, currentBalls), maxLives);
  const activeClassIcon = CLASS_ICON_BY_CLASS[activeClass];
  const litRubies = rubiesActive.filter(Boolean).length;
  const baseFooterLeft = `${activePlayerLabel} - ${ballsText}`;
  const baseFooterRight = `X${currentMultiplier} - RUBIS ${litRubies}/3`;

  if (!isPlaying && hasScoreClaimMessage(scoreClaimSnapshot)) {
    const claimScore = scoreClaimSnapshot.game?.finalScore ?? currentScore;
    const claimHeadline =
      getScoreClaimDmdMessage(scoreClaimSnapshot) ||
      (scoreClaimSnapshot.phase === "error" ? "ERREUR QR" : "FIN DE PARTIE");

    return {
      accent: scoreClaimSnapshot.phase === "error" ? "danger" : "claim",
      activeClass: activeClassIcon,
      activePlayerLabel,
      appMode,
      backgroundEffect: "none",
      currentBalls,
      currentMultiplier,
      currentScore: claimScore,
      eventMessage: getScoreClaimDmdSubline(scoreClaimSnapshot),
      footerLeft: "HALL DES HEROS",
      footerRight: formatDmdScore(claimScore),
      headline: claimHeadline,
      id: `claim-${scoreClaimSnapshot.phase}`,
      isAttractMode: false,
      isSunBonusActive: false,
      kicker: "RELIQUE SAUVEE",
      livesRemaining,
      maxLives,
      mineText,
      mode: "score-claim",
      multiplierSlots,
      playerCount: safePlayerCount,
      playerToken,
      priority: "P1",
      rubiesActive,
      scoreText: formatDmdScore(claimScore),
      subline: getScoreClaimDmdSubline(scoreClaimSnapshot),
    };
  }

  if (!isPlaying) {
    if (forceGameOver) {
      return {
        accent: "danger",
        activeClass: activeClassIcon,
        activePlayerLabel,
        appMode,
        backgroundEffect: "none",
        currentBalls,
        currentMultiplier,
        currentScore,
        eventMessage: "LA QUETE S ACHEVE",
        footerLeft: "SCORE FINAL",
        footerRight: `${safePlayerCount} JOUEUR${safePlayerCount > 1 ? "S" : ""}`,
        headline: "FIN DE PARTIE",
        id: "game-over",
        isAttractMode: false,
        isSunBonusActive: false,
        kicker: "FIN DE QUETE",
        livesRemaining: 0,
        maxLives,
        mineText,
        mode: "game-over",
        multiplierSlots,
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
      activeClass: null,
      activePlayerLabel,
      appMode,
      backgroundEffect: "none",
      currentBalls,
      currentMultiplier: 1,
      currentScore,
      eventMessage: attractMessage.subline,
      footerLeft: "MODE ATTENTE",
      footerRight: appMode.toUpperCase(),
      headline: attractMessage.headline,
      id: `attract-${Math.abs(Math.trunc(attractStep)) % ATTRACT_MESSAGES.length}`,
      isAttractMode: true,
      isSunBonusActive: false,
      kicker: "DONJONS & FLIPPERS",
      livesRemaining: maxLives,
      maxLives,
      mineText,
      mode: "attract",
      multiplierSlots: buildMultiplierSlots({}),
      playerCount: safePlayerCount,
      playerToken,
      priority: "P3",
      rubiesActive,
      scoreText,
      subline: attractMessage.subline,
    };
  }

  const isRewardState = currentMultiplier > 1 || backgroundEffect !== "none";

  return {
    accent: isRewardState ? "reward" : "neutral",
    activeClass: activeClassIcon,
    activePlayerLabel,
    appMode,
    backgroundEffect,
    currentBalls,
    currentMultiplier,
    currentScore,
    eventMessage,
    footerLeft: baseFooterLeft,
    footerRight: baseFooterRight,
    headline: scoreText,
    id: ballInLauncher ? "ball-ready" : "live-score",
    isAttractMode: false,
    isSunBonusActive,
    kicker: activePlayerLabel,
    livesRemaining,
    maxLives,
    mineText,
    mode: "live",
    multiplierSlots,
    playerCount: safePlayerCount,
    playerToken,
    priority: ballInLauncher ? "P2" : "P3",
    rubiesActive,
    scoreText,
    subline: eventMessage,
  };
}

export function createDmdMultiplierSnapshot(
  sources: Partial<Record<MultiplierSource, number>>,
  now = Date.now(),
): DmdMultiplierSnapshot {
  return Object.fromEntries(
    Object.entries(sources).map(([source, value]) => {
      const typedSource = source as MultiplierSource;
      const duration = MULTIPLIERS_CONFIG[typedSource].durationMs;

      return [
        typedSource,
        {
          value: value ?? MULTIPLIERS_CONFIG[typedSource].value,
          expiresAt: now + duration,
          totalDuration: duration,
        },
      ];
    }),
  );
}
