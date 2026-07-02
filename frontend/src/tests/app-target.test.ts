import { describe, expect, it } from "vitest";

import { parseAppTarget } from "../lib/app-target";

describe("app-target", () => {
  it("utilise le build flipper par defaut", () => {
    expect(parseAppTarget(undefined)).toBe("flipper");
    expect(parseAppTarget(null)).toBe("flipper");
    expect(parseAppTarget("unknown")).toBe("flipper");
  });

  it("active explicitement le build public", () => {
    expect(parseAppTarget("public")).toBe("public");
  });
});
