import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "@/store/gameStore/useGameStore";

function get() {
  return useGameStore.getState();
}

describe("createClassSlice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState({
      isPlaying: true,
      ballInLauncher: false,
      activeClass: "None",
      isPowerOnCooldown: false,
      powerCooldownExpiresAt: 0,
      powerCooldownTotalDuration: 0,
      swordActive: false,
      swordPositionIndex: 0,
      swordSpawnTimeoutId: null,
      warriorImpulseTrigger: 0,
      activeMultipliers: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("spawnSword", () => {
    it("activates the sword when playing and sword not active", () => {
      get().spawnSword();
      expect(get().swordActive).toBe(true);
    });

    it("does nothing when not playing", () => {
      useGameStore.setState({ isPlaying: false });
      get().spawnSword();
      expect(get().swordActive).toBe(false);
    });

    it("does nothing when sword is already active", () => {
      useGameStore.setState({ swordActive: true, swordPositionIndex: 1 });
      get().spawnSword();
      expect(get().swordPositionIndex).toBe(1);
    });
  });

  describe("scheduleSwordSpawn", () => {
    it("schedules a sword spawn and spawns after the delay", () => {
      get().scheduleSwordSpawn(5000);
      expect(get().swordActive).toBe(false);
      vi.advanceTimersByTime(5000);
      expect(get().swordActive).toBe(true);
    });

    it("cancels the previous timer when called again", () => {
      get().scheduleSwordSpawn(10000);
      get().scheduleSwordSpawn(5000);
      vi.advanceTimersByTime(5000);
      expect(get().swordActive).toBe(true);
    });
  });

  describe("collectSword", () => {
    it("deactivates sword and changes class", () => {
      useGameStore.setState({ swordActive: true, activeClass: "Elf" });
      get().collectSword();
      expect(get().swordActive).toBe(false);
      expect(get().activeClass).not.toBe("Elf");
    });

    it("does nothing when sword is not active", () => {
      useGameStore.setState({ activeClass: "Elf" });
      get().collectSword();
      expect(get().activeClass).toBe("Elf");
    });

    it("does nothing when not playing", () => {
      useGameStore.setState({ isPlaying: false, swordActive: true });
      get().collectSword();
      expect(get().swordActive).toBe(true);
    });
  });

  describe("useClassPower", () => {
    it("does nothing when not playing", () => {
      useGameStore.setState({ isPlaying: false, activeClass: "Warrior" });
      get().useClassPower();
      expect(get().isPowerOnCooldown).toBe(false);
    });

    it("does nothing when class is None", () => {
      get().useClassPower();
      expect(get().isPowerOnCooldown).toBe(false);
    });

    it("does nothing when already on cooldown", () => {
      useGameStore.setState({ activeClass: "Warrior", isPowerOnCooldown: true });
      get().useClassPower();
      expect(get().warriorImpulseTrigger).toBe(0);
    });

    it("does nothing when ball is in launcher", () => {
      useGameStore.setState({ activeClass: "Warrior", ballInLauncher: true });
      get().useClassPower();
      expect(get().isPowerOnCooldown).toBe(false);
    });

    it("Warrior: increments warriorImpulseTrigger and starts cooldown", () => {
      useGameStore.setState({ activeClass: "Warrior" });
      get().useClassPower();
      expect(get().warriorImpulseTrigger).toBe(1);
      expect(get().isPowerOnCooldown).toBe(true);
    });

    it("Dwarf: activates multiplier and sets mine hits to 3", () => {
      useGameStore.setState({ activeClass: "Dwarf" });
      get().useClassPower();
      expect(get().mineHits).toBe(3);
      expect(get().isPowerOnCooldown).toBe(true);
    });

    it("Elf: activates a multiplier when at least one is inactive", () => {
      useGameStore.setState({ activeClass: "Elf", activeMultipliers: {} });
      get().useClassPower();
      expect(get().isPowerOnCooldown).toBe(true);
    });

    it("Elf: does not start cooldown when all multipliers already active", () => {
      const future = Date.now() + 99999;
      useGameStore.setState({
        activeClass: "Elf",
        activeMultipliers: {
          lightRoad: { value: 2, expiresAt: future, totalDuration: 99999 },
          fakir: { value: 2, expiresAt: future, totalDuration: 99999 },
          rampHabitRight: { value: 2, expiresAt: future, totalDuration: 99999 },
          rampHabitLeft: { value: 2, expiresAt: future, totalDuration: 99999 },
          gems: { value: 2, expiresAt: future, totalDuration: 99999 },
        },
      });
      get().useClassPower();
      expect(get().isPowerOnCooldown).toBe(false);
    });

    it("cooldown clears after its duration", () => {
      useGameStore.setState({ activeClass: "Warrior" });
      get().useClassPower();
      expect(get().isPowerOnCooldown).toBe(true);
      vi.runAllTimers();
      expect(get().isPowerOnCooldown).toBe(false);
    });
  });

  describe("resetClassSystem", () => {
    it("resets all class state to defaults", () => {
      useGameStore.setState({
        activeClass: "Warrior",
        swordActive: true,
        isPowerOnCooldown: true,
        warriorImpulseTrigger: 3,
      });
      get().resetClassSystem();
      expect(get().activeClass).toBe("None");
      expect(get().swordActive).toBe(false);
      expect(get().isPowerOnCooldown).toBe(false);
      expect(get().warriorImpulseTrigger).toBe(0);
    });

    it("cancels a pending sword spawn timer", () => {
      get().scheduleSwordSpawn(5000);
      get().resetClassSystem();
      vi.advanceTimersByTime(5000);
      expect(get().swordActive).toBe(false);
    });
  });

  describe("debugSetClass", () => {
    it("sets the class and clears cooldown state", () => {
      useGameStore.setState({ isPowerOnCooldown: true });
      get().debugSetClass("Elf");
      expect(get().activeClass).toBe("Elf");
      expect(get().isPowerOnCooldown).toBe(false);
    });
  });

  describe("getClassZoneMultiplier", () => {
    it("returns 1 for None class on any zone", () => {
      expect(get().getClassZoneMultiplier("Bumpers")).toBe(1);
    });
  });
});
