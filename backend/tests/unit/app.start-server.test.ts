import { describe, expect, it, vi } from "vitest";

import { startServer } from "../../src/app.js";

describe("startServer", () => {
  it("binds the app on the requested port and logs when listening starts", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const fakeServer = { kind: "http-server" };
    const listen = vi.fn((port: number, callback: () => void) => {
      callback();
      return fakeServer;
    });

    const server = startServer({ listen } as never, 3456);

    expect(listen).toHaveBeenCalledWith(3456, expect.any(Function));
    expect(server).toBe(fakeServer);
    expect(consoleLog).toHaveBeenCalledWith("Backend listening on port 3456");

    consoleLog.mockRestore();
  });
});
