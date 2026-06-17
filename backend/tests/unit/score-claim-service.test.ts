import { describe, expect, it } from "vitest";

import {
  GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
  createScoreClaimCode,
  evaluateScorePersistence,
  getScoreClaimVerificationUrl,
  isScoreSignificant,
} from "../../src/services/score-claim-service.js";

describe("score-claim-service", () => {
  describe("isScoreSignificant", () => {
    // Ces tests protègent la règle la plus simple mais la plus structurante :
    // si on se trompe ici, on peut remplir la base avec des scores invités
    // sans valeur, ou au contraire jeter des scores qui devraient vivre.
    it("returns false when the final score is zero", () => {
      expect(isScoreSignificant(0, GUEST_MIN_SIGNIFICANT_DURATION_SECONDS)).toBe(false);
    });

    it("returns false when the played duration is below the significant threshold", () => {
      expect(isScoreSignificant(100, GUEST_MIN_SIGNIFICANT_DURATION_SECONDS - 1)).toBe(false);
    });

    it("returns true for a positive score with a significant duration", () => {
      expect(isScoreSignificant(100, GUEST_MIN_SIGNIFICANT_DURATION_SECONDS)).toBe(true);
    });
  });

  describe("evaluateScorePersistence", () => {
    // Ici on teste la règle métier centrale du projet.
    // On la teste en unitaire car elle est pure : cela donne des tests
    // rapides, lisibles, et très précis sur les décisions produit.
    it("returns discard for a non-significant guest score", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 0,
          isAuthenticated: false,
          mode: "arcade",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
          requestClaim: false,
          wouldEnterLeaderboard: false,
        }),
      ).toEqual({
        decision: "discard",
        reason: "score_not_significant",
      });
    });

    it("returns discard when the played duration stays below the significant threshold", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 2500,
          isAuthenticated: false,
          mode: "arcade",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS - 1,
          requestClaim: false,
          wouldEnterLeaderboard: true,
        }),
      ).toEqual({
        decision: "discard",
        reason: "score_not_significant",
      });
    });

    it("returns save for an authenticated player", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 2500,
          isAuthenticated: true,
          mode: "web",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
          requestClaim: false,
          wouldEnterLeaderboard: false,
        }),
      ).toEqual({
        decision: "save",
        reason: "authenticated_user",
      });
    });

    it("returns save_and_claimable for an arcade guest who requests a claim", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 2500,
          isAuthenticated: false,
          mode: "arcade",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
          requestClaim: true,
          wouldEnterLeaderboard: false,
        }),
      ).toEqual({
        decision: "save_and_claimable",
        reason: "guest_claim_requested",
      });
    });

    it("returns save when a non-arcade guest requests a claim", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 2500,
          isAuthenticated: false,
          mode: "web",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
          requestClaim: true,
          wouldEnterLeaderboard: false,
        }),
      ).toEqual({
        decision: "save",
        reason: "non_arcade_claim_request",
      });
    });

    it("returns save for a guest score that would enter the leaderboard", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 2500,
          isAuthenticated: false,
          mode: "arcade",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
          requestClaim: false,
          wouldEnterLeaderboard: true,
        }),
      ).toEqual({
        decision: "save",
        reason: "guest_score_saved_for_leaderboard",
      });
    });

    it("returns discard for a guest score below the leaderboard cutoff", () => {
      expect(
        evaluateScorePersistence({
          finalScore: 2500,
          isAuthenticated: false,
          mode: "arcade",
          playedDurationSeconds: GUEST_MIN_SIGNIFICANT_DURATION_SECONDS,
          requestClaim: false,
          wouldEnterLeaderboard: false,
        }),
      ).toEqual({
        decision: "discard",
        reason: "guest_score_below_leaderboard_cutoff",
      });
    });
  });

  describe("helpers", () => {
    // Ces tests vérifient les petits contrats techniques du flux mobile.
    // Ils sont moins critiques que la règle métier, mais ils protègent les
    // hypothèses de format dont dépend le QR côté frontend et backend.
    it("creates a base64url claim code with the expected length", () => {
      expect(createScoreClaimCode()).toMatch(/^[A-Za-z0-9_-]{32}$/);
    });

    it("builds a verification URL with claim code and arcade mode", () => {
      expect(
        getScoreClaimVerificationUrl("http://localhost:5173", "abc123"),
      ).toBe("http://localhost:5173/score-claim?code=abc123&mode=arcade");
    });
  });
});
