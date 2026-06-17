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
        protocol: "https:",
      },
    });

    const { apiEndpoint, apiUrl } = await importApi();

    expect(apiUrl).toBe("https://frontend.pinball.test:3000");
    expect(apiEndpoint("/auth/session")).toBe(
      "https://frontend.pinball.test:3000/auth/session",
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
