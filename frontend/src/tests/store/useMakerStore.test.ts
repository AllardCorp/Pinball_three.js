import { beforeEach, describe, expect, it } from "vitest";
import { MAKER_ELEMENT_CONFIG } from "@/config/makerElementConfig";
import { type LevelDetail, useMakerStore } from "@/store/useMakerStore";

function get() {
  return useMakerStore.getState();
}

describe("useMakerStore", () => {
  beforeEach(() => {
    useMakerStore.setState({
      elements: [],
      selectedElementId: null,
      levelName: "Mon niveau",
      levelId: null,
    });
  });

  describe("addElement", () => {
    it("uses MAKER_ELEMENT_CONFIG defaults for a box", () => {
      get().addElement("box");
      const [element] = get().elements;

      expect(element).toMatchObject({
        type: "box",
        name: MAKER_ELEMENT_CONFIG.box.label,
        ...MAKER_ELEMENT_CONFIG.box.defaults,
      });
    });

    it("uses MAKER_ELEMENT_CONFIG defaults for a cylinder and a sphere", () => {
      get().addElement("cylinder");
      get().addElement("sphere");
      const [cylinder, sphere] = get().elements;

      expect(cylinder).toMatchObject(MAKER_ELEMENT_CONFIG.cylinder.defaults);
      expect(sphere).toMatchObject(MAKER_ELEMENT_CONFIG.sphere.defaults);
    });

    it("selects the newly created element", () => {
      get().addElement("box");
      const [element] = get().elements;

      expect(get().selectedElementId).toBe(element.id);
    });
  });

  describe("setLevelId", () => {
    it("sets levelId without touching other fields", () => {
      get().setLevelId("level-123");

      expect(get().levelId).toBe("level-123");
      expect(get().levelName).toBe("Mon niveau");
    });
  });

  describe("resetLevel", () => {
    it("clears levelId back to null", () => {
      get().setLevelId("level-123");
      get().addElement("box");

      get().resetLevel();

      expect(get().levelId).toBeNull();
      expect(get().elements).toEqual([]);
      expect(get().levelName).toBe("Mon niveau");
    });
  });

  describe("loadLevel", () => {
    const level: LevelDetail = {
      id: "level-456",
      name: "Niveau chargé",
      screenshotUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      isOwner: true,
      elements: [
        {
          id: "el-1",
          name: "Cylindre",
          type: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ],
    };

    it("sets elements, levelName and levelId from the payload", () => {
      get().loadLevel(level);

      expect(get().elements).toEqual(level.elements);
      expect(get().levelName).toBe("Niveau chargé");
      expect(get().levelId).toBe("level-456");
      expect(get().selectedElementId).toBeNull();
    });

    it("keeps an element with an unrecognized type intact (never filtered)", () => {
      const levelWithUnknownElement: LevelDetail = {
        ...level,
        elements: [
          ...level.elements,
          {
            id: "el-future",
            name: "Rampe",
            // @ts-expect-error - type volontairement absent de MAKER_ELEMENT_CONFIG
            type: "future-ramp",
            position: [1, 2, 3],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        ],
      };

      get().loadLevel(levelWithUnknownElement);

      expect(get().elements).toHaveLength(2);
      expect(get().elements[1]).toMatchObject({ id: "el-future", type: "future-ramp" });
    });
  });
});
