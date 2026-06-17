import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const close = vi.fn((callback?: () => void | Promise<void>) => {
    void callback?.();
  });

  return {
    close,
    createApp: vi.fn(() => ({ kind: "app" })),
    endPool: vi.fn(async () => undefined),
    env: { port: 4321 },
    processOn: vi.fn(),
    processExit: vi.fn(),
    startServer: vi.fn(() => ({
      close,
    })),
  };
});

vi.mock("../../src/app.js", () => ({
  createApp: mocks.createApp,
  startServer: mocks.startServer,
}));

vi.mock("../../src/db/client.js", () => ({
  getPool: vi.fn(() => ({
    end: mocks.endPool,
  })),
}));

vi.mock("../../src/env.js", () => ({
  env: mocks.env,
}));

describe("server bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(process, "on").mockImplementation(mocks.processOn as never);
    vi.spyOn(process, "exit").mockImplementation(mocks.processExit as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates the app, starts the server, and registers shutdown handlers", async () => {
    await import("../../src/server.js");

    expect(mocks.createApp).toHaveBeenCalledTimes(1);
    expect(mocks.startServer).toHaveBeenCalledWith({ kind: "app" }, 4321);
    expect(mocks.processOn).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(mocks.processOn).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
  });

  it("closes the HTTP server and the pool when SIGTERM is received", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../../src/server.js");

    const signalHandler = mocks.processOn.mock.calls.find(
      ([signal]) => signal === "SIGTERM",
    )?.[1] as (() => void) | undefined;

    expect(signalHandler).toBeTypeOf("function");

    signalHandler?.();
    await Promise.resolve();

    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(mocks.endPool).toHaveBeenCalledTimes(1);
    expect(mocks.processExit).toHaveBeenCalledWith(0);
    expect(consoleLog).toHaveBeenCalledWith(
      "Signal SIGTERM reçu, arrêt du backend en cours...",
    );
    consoleLog.mockRestore();
  });
});
