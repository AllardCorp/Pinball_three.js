import { describe, expect, it, vi } from "vitest";

import {
  RemoteScoreClaimError,
  startRemoteScoreClaim,
} from "../../src/services/remote-score-claim-client.js";

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
    ...init,
  });
}

function expectInvalidRemotePayload(fetchImpl: typeof fetch) {
  return expect(
    startRemoteScoreClaim({
      borneToken: "cabinet-secret",
      fetchImpl,
      globalApiUrl: "https://scores.example.test",
      payload: validPayload,
    }),
  ).rejects.toMatchObject({
    code: "remote_score_claim_invalid_response",
    status: 502,
  } satisfies Partial<RemoteScoreClaimError>);
}

const validPayload = {
  finalScore: 123456,
  mode: "arcade" as const,
  playedDurationSeconds: 95,
  requestClaim: true,
};

const validResponse = {
  claim: {
    claimCode: "ABCDEFGHIJKLMNOPQRSTUVWX12345678",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    status: "pending",
    verificationUrl: "https://scores.example.test/score-claim?code=abc&mode=arcade",
  },
  decision: "save_and_claimable",
  game: {
    finalScore: 123456,
    id: 42,
    playedAt: new Date().toISOString(),
    playedDurationSeconds: 95,
  },
  reason: "guest_claim_requested",
} as const;

describe("remote-score-claim-client", () => {
  it("posts the score to the VPS borne endpoint with the bearer token", async () => {
    const fetchImpl = vi.fn(async () => createJsonResponse(validResponse));

    const response = await startRemoteScoreClaim({
      borneToken: "cabinet-secret",
      fetchImpl,
      globalApiUrl: "https://scores.example.test",
      payload: validPayload,
    });

    expect(response).toEqual(validResponse);
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL("https://scores.example.test/api/borne/score-claims/start"),
      expect.objectContaining({
        body: JSON.stringify(validPayload),
        headers: {
          Authorization: "Bearer cabinet-secret",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it("maps network failures to a 502 integration error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });

    await expect(
      startRemoteScoreClaim({
        borneToken: "cabinet-secret",
        fetchImpl,
        globalApiUrl: "https://scores.example.test",
        payload: validPayload,
      }),
    ).rejects.toMatchObject({
      code: "remote_score_claim_unreachable",
      status: 502,
    } satisfies Partial<RemoteScoreClaimError>);
  });

  it("maps non-successful VPS responses to a 502 integration error", async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({ error: "invalid_borne_token" }, { status: 401 }),
    );

    await expect(
      startRemoteScoreClaim({
        borneToken: "cabinet-secret",
        fetchImpl,
        globalApiUrl: "https://scores.example.test",
        payload: validPayload,
      }),
    ).rejects.toMatchObject({
      code: "remote_score_claim_failed",
      status: 502,
    } satisfies Partial<RemoteScoreClaimError>);
  });

  it("rejects malformed VPS responses before a QR code can be displayed", async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({
        claim: {
          verificationUrl: "not-an-url",
        },
        decision: "save_and_claimable",
        game: null,
        reason: "guest_claim_requested",
      }),
    );

    await expectInvalidRemotePayload(fetchImpl);
  });

  it("rejects invalid claim codes received from the VPS", async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({
        ...validResponse,
        claim: {
          ...validResponse.claim,
          claimCode: "not-a-valid-code",
        },
      }),
    );

    await expectInvalidRemotePayload(fetchImpl);
  });

  it("rejects unreadable JSON responses from the VPS", async () => {
    const fetchImpl = vi.fn(async () => new Response("not-json", { status: 200 }));

    await expectInvalidRemotePayload(fetchImpl);
  });

  it("rejects non-object VPS responses", async () => {
    const fetchImpl = vi.fn(async () => createJsonResponse(null));

    await expectInvalidRemotePayload(fetchImpl);
  });

  it("rejects unknown persistence decisions or reasons from the VPS", async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({
        ...validResponse,
        decision: "unknown",
      }),
    );

    await expectInvalidRemotePayload(fetchImpl);
  });
});
