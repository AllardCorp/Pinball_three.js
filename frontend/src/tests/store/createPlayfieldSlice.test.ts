import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "@/store/gameStore/useGameStore";

function get() {
  return useGameStore.getState();
}

describe("createPlayfieldSlice", () => {
  beforeEach(() => {
    useGameStore.setState({
      isPlaying: true,
      mineHits: 0,
      rubiesActive: [false, false, false],
      leftKickbackActive: true,
      rightKickbackActive: true,
    });
  });

  describe("incrementMine", () => {
    it("increments from 0 to 3 step by step", () => {
      get().incrementMine();
      expect(get().mineHits).toBe(1);
      get().incrementMine();
      expect(get().mineHits).toBe(2);
      get().incrementMine();
      expect(get().mineHits).toBe(3);
    });

    it("does not exceed 3", () => {
      useGameStore.setState({ mineHits: 3 });
      get().incrementMine();
      expect(get().mineHits).toBe(3);
    });
  });

  describe("setMineHits", () => {
    it("sets directly to the given value", () => {
      get().setMineHits(2);
      expect(get().mineHits).toBe(2);
    });
  });

  describe("resetMine", () => {
    it("sets mineHits back to 0", () => {
      useGameStore.setState({ mineHits: 3 });
      get().resetMine();
      expect(get().mineHits).toBe(0);
    });
  });

  describe("toggleRuby", () => {
    it("activates a ruby", () => {
      get().toggleRuby(1);
      expect(get().rubiesActive[1]).toBe(true);
    });

    it("deactivates a ruby already active", () => {
      useGameStore.setState({ rubiesActive: [false, true, false] });
      get().toggleRuby(1);
      expect(get().rubiesActive[1]).toBe(false);
    });

    it("resets all rubies and grants bonus when all three become active", () => {
      useGameStore.setState({
        rubiesActive: [true, true, false],
        scores: [0],
        currentPlayerIndex: 0,
      });
      get().toggleRuby(2);
      expect(get().rubiesActive).toEqual([false, false, false]);
    });
  });

  describe("useKickback", () => {
    it("deactivates the left kickback", () => {
      get().useKickback("left");
      expect(get().leftKickbackActive).toBe(false);
    });

    it("deactivates the right kickback", () => {
      get().useKickback("right");
      expect(get().rightKickbackActive).toBe(false);
    });
  });
});
