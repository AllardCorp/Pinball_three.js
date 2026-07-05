import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScoreClaim } from "../hooks/useScoreClaim";

const pendingClaimPayload = {
  approvedAt: null,
  expiresAt: "2026-07-03T12:00:00.000Z",
  game: {
    finalScore: 123_456,
    id: 12,
    playedAt: "2026-07-03T11:55:00.000Z",
    playedDurationSeconds: 95,
  },
  status: "pending" as const,
  user: null,
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

describe("useScoreClaim", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reste idle et ne contacte pas l'API sans code de claim", () => {
    const { result } = renderHook(() => useScoreClaim({ claimCode: "" }));

    expect(result.current.status).toBe("idle");
    expect(result.current.claim).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { expectedStatus: "not_found", httpStatus: 404 },
    { expectedStatus: "expired", httpStatus: 410 },
    { expectedStatus: "error", httpStatus: 500 },
  ] as const)(
    "expose le statut $expectedStatus quand le chargement répond $httpStatus",
    async ({ expectedStatus, httpStatus }) => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: httpStatus }));

      const { result } = renderHook(() =>
        useScoreClaim({ claimCode: "CLAIM-CODE" }),
      );

      await waitFor(() => expect(result.current.status).toBe(expectedStatus));
    },
  );

  it("affiche directement la confirmation mobile avec la réponse d'approbation", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(pendingClaimPayload))
      .mockResolvedValueOnce(
        jsonResponse({
          approvedAt: "2026-07-03T12:01:00.000Z",
          expiresAt: pendingClaimPayload.expiresAt,
          game: {
            ...pendingClaimPayload.game,
            finalScore: 130_000,
          },
          status: "approved",
          user: {
            username: "player_mobile",
          },
        }),
      );

    const { result } = renderHook(() =>
      useScoreClaim({ claimCode: "CLAIM-CODE" }),
    );

    await waitFor(() => expect(result.current.status).toBe("pending"));

    await act(async () => {
      await result.current.approveScoreClaim();
    });

    expect(result.current.status).toBe("approved");
    expect(result.current.claim).toMatchObject({
      game: {
        finalScore: 130_000,
      },
      status: "approved",
      user: {
        username: "player_mobile",
      },
    });
    expect(result.current.feedback).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      expectedFeedback: "Cette demande n'existe plus.",
      expectedStatus: "not_found",
      httpStatus: 404,
    },
    {
      expectedFeedback: "Le délai pour rattacher ce score est expiré.",
      expectedStatus: "expired",
      httpStatus: 410,
    },
    {
      expectedFeedback: "claim already approved elsewhere",
      expectedStatus: "pending",
      httpStatus: 409,
      payload: { error: "claim already approved elsewhere" },
    },
  ] as const)(
    "gère proprement une approbation refusée avec le statut $httpStatus",
    async ({ expectedFeedback, expectedStatus, httpStatus, payload }) => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(pendingClaimPayload))
        .mockResolvedValueOnce(jsonResponse(payload ?? {}, httpStatus));

      const { result } = renderHook(() =>
        useScoreClaim({ claimCode: "CLAIM-CODE" }),
      );

      await waitFor(() => expect(result.current.status).toBe("pending"));

      await act(async () => {
        await result.current.approveScoreClaim();
      });

      expect(result.current.status).toBe(expectedStatus);
      expect(result.current.feedback).toBe(expectedFeedback);
    },
  );
});
