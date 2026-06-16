import { describe, expect, it } from "vitest";

import { parseAppMode, withAppMode } from "../lib/app-mode";

describe("app-mode", () => {
  describe("parseAppMode", () => {
    it("retourne le mode web par defaut", () => {
      expect(parseAppMode("web")).toBe("web");
      expect(parseAppMode(null)).toBe("web");
      expect(parseAppMode(undefined)).toBe("web");
      expect(parseAppMode("invalid")).toBe("web");
    });

    it("retourne le mode arcade quand il est explicite", () => {
      expect(parseAppMode("arcade")).toBe("arcade");
    });
  });

  describe("withAppMode", () => {
    it("ajoute le mode sur une URL relative", () => {
      expect(withAppMode("/login", "arcade")).toBe("/login?mode=arcade");
    });

    it("preserve query et hash sur une URL relative", () => {
      expect(withAppMode("/dashboard?tab=scores#top", "web")).toBe(
        "/dashboard?tab=scores&mode=web#top",
      );
    });

    it("ajoute le mode avant le hash", () => {
      expect(withAppMode("/playfield#cabinet", "arcade")).toBe(
        "/playfield?mode=arcade#cabinet",
      );
    });

    it("retourne une URL absolue complete quand l'entree est absolue", () => {
      expect(
        withAppMode("https://pinball.example/play?table=gold#game", "web"),
      ).toBe("https://pinball.example/play?table=gold&mode=web#game");
    });
  });
});
