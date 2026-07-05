import { describe, expect, it } from "vitest";

import {
  MAKER_ELEMENT_TYPES,
  makerElementSchema,
  makerElementsSchema,
  parseLevelWritePayload,
} from "../../src/domain/maker-elements.js";

function validElement(overrides: Record<string, unknown> = {}) {
  return {
    id: "el-1",
    name: "Cylindre",
    type: "cylinder",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    ...overrides,
  };
}

describe("maker-elements schema", () => {
  it("accepts a structurally valid element of each whitelisted type", () => {
    for (const type of MAKER_ELEMENT_TYPES) {
      const result = makerElementSchema.safeParse(validElement({ type }));
      expect(result.success).toBe(true);
    }
  });

  it("accepts optional fields when absent", () => {
    const result = makerElementSchema.safeParse(validElement());
    expect(result.success).toBe(true);
  });

  it("accepts optional fields when present and within range", () => {
    const result = makerElementSchema.safeParse(
      validElement({
        color: "#ff0000",
        roughness: 0.5,
        metalness: 0.5,
        isBumper: true,
        bumpStrength: 20,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an element whose type is not in the whitelist", () => {
    const result = makerElementSchema.safeParse(validElement({ type: "ramp" }));
    expect(result.success).toBe(false);
  });

  it("rejects a position tuple with fewer than 3 numbers", () => {
    const result = makerElementSchema.safeParse(validElement({ position: [0, 0] }));
    expect(result.success).toBe(false);
  });

  it("rejects a rotation tuple with a non-numeric value", () => {
    const result = makerElementSchema.safeParse(validElement({ rotation: [0, "0", 0] }));
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range optional numeric field", () => {
    const result = makerElementSchema.safeParse(validElement({ roughness: 1.5 }));
    expect(result.success).toBe(false);
  });

  it("rejects an empty id or name", () => {
    expect(makerElementSchema.safeParse(validElement({ id: "" })).success).toBe(false);
    expect(makerElementSchema.safeParse(validElement({ name: "" })).success).toBe(false);
  });

  it("rejects an array longer than the maximum cap", () => {
    const tooMany = Array.from({ length: 501 }, (_, index) =>
      validElement({ id: `el-${index}` }),
    );
    expect(makerElementsSchema.safeParse(tooMany).success).toBe(false);
  });

  it("accepts an array at the maximum cap", () => {
    const atCap = Array.from({ length: 500 }, (_, index) => validElement({ id: `el-${index}` }));
    expect(makerElementsSchema.safeParse(atCap).success).toBe(true);
  });
});

describe("parseLevelWritePayload", () => {
  it("trims the name and returns validated elements", () => {
    const payload = parseLevelWritePayload({
      name: "  My Level  ",
      elements: [validElement()],
    });

    expect(payload.name).toBe("My Level");
    expect(payload.elements).toHaveLength(1);
  });

  it("throws a level_name_required error for a missing or blank name", () => {
    expect(() => parseLevelWritePayload({ name: "  ", elements: [] })).toThrowError(
      expect.objectContaining({ code: "level_name_required", status: 400 }),
    );
  });

  it("throws a level_elements_invalid error when elements is not an array", () => {
    expect(() =>
      parseLevelWritePayload({ name: "Level", elements: "not-an-array" }),
    ).toThrowError(expect.objectContaining({ code: "level_elements_invalid", status: 400 }));
  });

  it("throws a level_elements_invalid error when an element has an unknown type", () => {
    expect(() =>
      parseLevelWritePayload({
        name: "Level",
        elements: [validElement({ type: "ramp" })],
      }),
    ).toThrowError(expect.objectContaining({ code: "level_elements_invalid", status: 400 }));
  });
});
