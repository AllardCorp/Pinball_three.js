import { describe, expect, it } from "vitest";
import {
  getMakerElementConfig,
  isMakerElementType,
  MAKER_ELEMENT_CONFIG,
  MAKER_ELEMENT_TYPES,
} from "@/config/makerElementConfig";

describe("makerElementConfig", () => {
  it("has a fully populated config entry for every declared type", () => {
    for (const type of MAKER_ELEMENT_TYPES) {
      const config = MAKER_ELEMENT_CONFIG[type];

      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.emoji).toBeTruthy();
      expect(config.paletteColorClass).toBeTruthy();
      expect(config.selectedColor).toBeTruthy();
      expect(config.geometry.args.length).toBeGreaterThan(0);
      expect(config.defaults.color).toBeTruthy();
      expect(config.defaults.roughness).toBeGreaterThanOrEqual(0);
      expect(config.defaults.metalness).toBeGreaterThanOrEqual(0);
      expect(typeof config.defaults.isBumper).toBe("boolean");
      expect(config.defaults.bumpStrength).toBeGreaterThan(0);
    }
  });

  it("has exactly one config entry per declared type (no orphans)", () => {
    expect(Object.keys(MAKER_ELEMENT_CONFIG).sort()).toEqual([...MAKER_ELEMENT_TYPES].sort());
  });

  describe("isMakerElementType", () => {
    it("returns true for every declared type", () => {
      for (const type of MAKER_ELEMENT_TYPES) {
        expect(isMakerElementType(type)).toBe(true);
      }
    });

    it("returns false for an unknown string or non-string value", () => {
      expect(isMakerElementType("future-ramp")).toBe(false);
      expect(isMakerElementType(42)).toBe(false);
      expect(isMakerElementType(undefined)).toBe(false);
    });
  });

  describe("getMakerElementConfig", () => {
    it("returns the matching config for a known type", () => {
      expect(getMakerElementConfig("box")).toBe(MAKER_ELEMENT_CONFIG.box);
    });

    it("returns undefined for an unknown type", () => {
      expect(getMakerElementConfig("future-ramp")).toBeUndefined();
    });
  });
});
