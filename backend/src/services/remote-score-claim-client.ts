import type {
  ScoreClaimStartClaim,
  ScoreClaimStartGame,
  ScoreClaimStartPayload,
  ScoreClaimStartResponse,
  ScorePersistenceDecision,
  ScorePersistenceReason,
} from "./score-claim-service.js";

const claimCodeLength = 32;

type RemoteScoreClaimStartInput = {
  borneToken: string;
  fetchImpl?: typeof fetch;
  globalApiUrl: string;
  payload: ScoreClaimStartPayload;
};

type RemoteScoreClaimStatusInput = {
  claimCode: string;
  fetchImpl?: typeof fetch;
  globalApiUrl: string;
};

export type RemoteScoreClaimStatusResponse = {
  approvedAt: string | null;
  expiresAt: string;
  game: ScoreClaimStartGame;
  status: "pending" | "approved";
  user: {
    username: string | null;
  } | null;
};

export type RemoteScoreClaimStatusResult =
  | {
      body: RemoteScoreClaimStatusResponse;
      statusCode: 200;
    }
  | {
      body: { status: "expired" };
      statusCode: 410;
    }
  | {
      body: { status: "not_found" };
      statusCode: 404;
    };

export type RemoteScoreClaimStarter = (
  input: RemoteScoreClaimStartInput,
) => Promise<ScoreClaimStartResponse>;

export type RemoteScoreClaimStatusChecker = (
  input: RemoteScoreClaimStatusInput,
) => Promise<RemoteScoreClaimStatusResult>;

export class RemoteScoreClaimError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "RemoteScoreClaimError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScorePersistenceDecision(value: unknown): value is ScorePersistenceDecision {
  return value === "discard" || value === "save" || value === "save_and_claimable";
}

function isScorePersistenceReason(value: unknown): value is ScorePersistenceReason {
  return (
    value === "authenticated_user" ||
    value === "guest_claim_requested" ||
    value === "guest_score_saved_for_leaderboard" ||
    value === "guest_score_below_leaderboard_cutoff" ||
    value === "score_not_significant" ||
    value === "non_arcade_claim_request"
  );
}

function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isAbsoluteUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isClaimCodeCharacter(character: string): boolean {
  const isUppercaseLetter = character >= "A" && character <= "Z";
  const isLowercaseLetter = character >= "a" && character <= "z";
  const isDigit = character >= "0" && character <= "9";

  return (
    isUppercaseLetter ||
    isLowercaseLetter ||
    isDigit ||
    character === "_" ||
    character === "-"
  );
}

function isScoreClaimCode(value: unknown): value is string {
  if (typeof value !== "string" || value.length !== claimCodeLength) {
    return false;
  }

  // Même logique que la validation route backend, sans regex.
  // Le QR code ne doit jamais être généré depuis un code reçu mais invalide.
  return [...value].every(isClaimCodeCharacter);
}

function isScoreClaimStartGame(value: unknown): value is ScoreClaimStartGame {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    typeof value.finalScore === "number" &&
    Number.isInteger(value.finalScore) &&
    typeof value.playedDurationSeconds === "number" &&
    Number.isInteger(value.playedDurationSeconds) &&
    isIsoDateString(value.playedAt)
  );
}

function isScoreClaimStartClaim(value: unknown): value is ScoreClaimStartClaim {
  return (
    isRecord(value) &&
    isScoreClaimCode(value.claimCode) &&
    isIsoDateString(value.expiresAt) &&
    value.status === "pending" &&
    isAbsoluteUrl(value.verificationUrl)
  );
}

function isScoreClaimStatusUser(
  value: unknown,
): value is RemoteScoreClaimStatusResponse["user"] {
  return (
    value === null ||
    (isRecord(value) &&
      (typeof value.username === "string" || value.username === null))
  );
}

function isScoreClaimStatusResponse(
  value: unknown,
): value is RemoteScoreClaimStatusResponse {
  return (
    isRecord(value) &&
    (value.status === "pending" || value.status === "approved") &&
    isIsoDateString(value.expiresAt) &&
    (typeof value.approvedAt === "string"
      ? isIsoDateString(value.approvedAt)
      : value.approvedAt === null) &&
    isScoreClaimStartGame(value.game) &&
    isScoreClaimStatusUser(value.user)
  );
}

function isScoreClaimStartResponse(value: unknown): value is ScoreClaimStartResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (!isScorePersistenceDecision(value.decision) || !isScorePersistenceReason(value.reason)) {
    return false;
  }

  const gameIsValid = value.game === null || isScoreClaimStartGame(value.game);
  const claimIsValid = value.claim === null || isScoreClaimStartClaim(value.claim);

  return gameIsValid && claimIsValid;
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function startRemoteScoreClaim({
  borneToken,
  fetchImpl = fetch,
  globalApiUrl,
  payload,
}: RemoteScoreClaimStartInput): Promise<ScoreClaimStartResponse> {
  const endpoint = new URL("/api/borne/score-claims/start", globalApiUrl);
  let response: Response;

  try {
    response = await fetchImpl(endpoint, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${borneToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    throw new RemoteScoreClaimError(
      502,
      "remote_score_claim_unreachable",
      "The remote score claim API could not be reached.",
    );
  }

  const responseBody = await readJsonResponse(response);

  if (!response.ok) {
    throw new RemoteScoreClaimError(
      502,
      "remote_score_claim_failed",
      "The remote score claim API rejected the score.",
    );
  }

  // Le backend local relaie cette réponse au backglass.
  // On valide donc le contrat reçu du VPS avant d'afficher un QR code public.
  if (!isScoreClaimStartResponse(responseBody)) {
    throw new RemoteScoreClaimError(
      502,
      "remote_score_claim_invalid_response",
      "The remote score claim API returned an invalid payload.",
    );
  }

  return responseBody;
}

export async function getRemoteScoreClaimStatus({
  claimCode,
  fetchImpl = fetch,
  globalApiUrl,
}: RemoteScoreClaimStatusInput): Promise<RemoteScoreClaimStatusResult> {
  const endpoint = new URL(
    `/api/score-claims/status/${encodeURIComponent(claimCode)}`,
    globalApiUrl,
  );
  let response: Response;

  try {
    response = await fetchImpl(endpoint, {
      method: "GET",
    });
  } catch {
    throw new RemoteScoreClaimError(
      502,
      "remote_score_claim_status_unreachable",
      "The remote score claim status API could not be reached.",
    );
  }

  const responseBody = await readJsonResponse(response);

  // Ces deux statuts sont volontairement relayés tels quels : ils décrivent un
  // état métier attendu et permettent au front local d'arrêter son polling.
  if (response.status === 404) {
    return {
      body: { status: "not_found" },
      statusCode: 404,
    };
  }

  if (response.status === 410) {
    return {
      body: { status: "expired" },
      statusCode: 410,
    };
  }

  if (!response.ok) {
    throw new RemoteScoreClaimError(
      502,
      "remote_score_claim_status_failed",
      "The remote score claim status API rejected the status lookup.",
    );
  }

  if (!isScoreClaimStatusResponse(responseBody)) {
    throw new RemoteScoreClaimError(
      502,
      "remote_score_claim_status_invalid_response",
      "The remote score claim status API returned an invalid payload.",
    );
  }

  return {
    body: responseBody,
    statusCode: 200,
  };
}
