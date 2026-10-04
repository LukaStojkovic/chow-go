import { afterEach, describe, expect, it, vi } from "vitest";

import { importWithReload } from "./lazyNamed";

const FLAG = "chowgo:chunk-reload";
const chunkError = () => new TypeError("Failed to fetch dynamically imported module: /assets/Page-abc.js");

const reload = vi.fn();

afterEach(() => {
  reload.mockReset();
});

Object.defineProperty(window, "location", {
  configurable: true,
  value: { ...window.location, reload },
});

describe("importWithReload", () => {
  it("resolves the module and clears the reload flag", async () => {
    sessionStorage.setItem(FLAG, "1");
    await expect(importWithReload(() => Promise.resolve({ Page: "ok" }))).resolves.toEqual({ Page: "ok" });
    expect(sessionStorage.getItem(FLAG)).toBeNull();
  });

  it("reloads once on a stale chunk and never settles", async () => {
    const pending = importWithReload(() => Promise.reject(chunkError()));
    const settled = await Promise.race([pending.then(() => "settled", () => "settled"), Promise.resolve("pending")]);
    await Promise.resolve();
    expect(settled).toBe("pending");
    expect(reload).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem(FLAG)).toBe("1");
  });

  it("does not reload a second time", async () => {
    sessionStorage.setItem(FLAG, "1");
    await expect(importWithReload(() => Promise.reject(chunkError()))).rejects.toThrow(/dynamically imported/);
    expect(reload).not.toHaveBeenCalled();
  });

  it("rethrows ordinary errors without reloading", async () => {
    await expect(importWithReload(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(reload).not.toHaveBeenCalled();
  });
});
