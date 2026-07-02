import { afterEach, describe, expect, it, vi } from "vitest";

async function importApi() {
  vi.resetModules();
  return import("../lib/api");
}

describe("api", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("utilise VITE_API_URL quand il est defini", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.pinball.example/base/");

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("https://api.pinball.example/base/");
    expect(apiEndpoint("scores")).toBe(
      "https://api.pinball.example/base/scores",
    );
  });

  it("resout l'URL depuis window.location quand VITE_API_URL est absent", async () => {
    vi.stubEnv("VITE_API_URL", "");
    vi.stubGlobal("window", {
      location: {
        hostname: "frontend.pinball.test",
        origin: "https://frontend.pinball.test",
        protocol: "https:",
      },
    });

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("https://frontend.pinball.test");
    expect(apiEndpoint("/auth/session")).toBe(
      "https://frontend.pinball.test/auth/session",
    );
  });

  it("utilise l'origine du frontend en production flipper avec le fallback localhost", async () => {
    vi.stubEnv("VITE_APP_TARGET", "flipper");
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        origin: "http://localhost",
        port: "",
        protocol: "http:",
      },
    });

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("http://localhost");
    expect(apiEndpoint("/api/score-claims/start")).toBe(
      "http://localhost/api/score-claims/start",
    );
  });

  it("ignore VITE_API_URL en production flipper pour passer par Nginx", async () => {
    vi.stubEnv("VITE_APP_TARGET", "flipper");
    vi.stubEnv("VITE_API_URL", "https://pinball.dev-christopher.fr");
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        origin: "http://localhost",
        port: "",
        protocol: "http:",
      },
    });

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("http://localhost");
    expect(apiEndpoint("/api/score-claims/start")).toBe(
      "http://localhost/api/score-claims/start",
    );
  });

  it("ignore un fallback localhost dans le build public VPS", async () => {
    vi.stubEnv("VITE_APP_TARGET", "public");
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    vi.stubGlobal("window", {
      location: {
        hostname: "pinball.dev-christopher.fr",
        origin: "https://pinball.dev-christopher.fr",
        port: "",
        protocol: "https:",
      },
    });

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("https://pinball.dev-christopher.fr");
    expect(apiEndpoint("/api/score-claims/start")).toBe(
      "https://pinball.dev-christopher.fr/api/score-claims/start",
    );
  });

  it("conserve l'URL backend explicite pendant le dev Vite", async () => {
    vi.stubEnv("VITE_APP_TARGET", "flipper");
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        origin: "http://localhost:5173",
        port: "5173",
        protocol: "http:",
      },
    });

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("http://localhost:3000");
    expect(apiEndpoint("/api/score-claims/start")).toBe(
      "http://localhost:3000/api/score-claims/start",
    );
  });

  it("utilise localhost quand window n'est pas disponible", async () => {
    vi.stubEnv("VITE_API_URL", "");
    vi.stubGlobal("window", undefined);

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("http://localhost:3000");
    expect(apiEndpoint("/health")).toBe("http://localhost:3000/health");
  });
});
