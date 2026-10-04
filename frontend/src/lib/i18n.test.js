import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_STORAGE_KEY, currentLocale } from "@chowgo/shared/i18n";

import { clearCachedQueries, detectLocale, registerQueryClient, setLocale, setupI18n } from "./i18n";

const setLanguages = (languages) =>
  Object.defineProperty(navigator, "languages", { configurable: true, get: () => languages });

afterEach(() => {
  setLanguages(["en-US", "en"]);
  registerQueryClient(null);
});

describe("detectLocale", () => {
  it("lets a stored choice win over the browser", () => {
    setLanguages(["sr-Latn-RS"]);
    localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    expect(detectLocale()).toBe("en");
  });

  it("falls back to the browser's languages", () => {
    setLanguages(["de-DE", "sr-Cyrl-ME"]);
    expect(detectLocale()).toBe("sr");
  });

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    setLanguages(["sr"]);
    expect(detectLocale()).toBe("sr");
  });
});

describe("setupI18n", () => {
  it("boots in the detected language and sets <html lang>", () => {
    setLanguages(["sr-RS"]);
    expect(setupI18n()).toBe("sr");
    expect(document.documentElement.lang).toBe("sr-Latn-RS");
  });
});

describe("setLocale", () => {
  it("switches, persists, updates the document and refreshes queries", async () => {
    const client = { invalidateQueries: vi.fn(), clear: vi.fn() };
    registerQueryClient(client);

    await expect(setLocale("sr")).resolves.toBe("sr");
    expect(currentLocale()).toBe("sr");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("sr");
    expect(document.documentElement.lang).toBe("sr-Latn-RS");
    expect(client.invalidateQueries).toHaveBeenCalledOnce();

    clearCachedQueries();
    expect(client.clear).toHaveBeenCalledOnce();
  });

  it("still switches when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    await expect(setLocale("sr")).resolves.toBe("sr");
  });

  it("does nothing to queries before a client is registered", async () => {
    await expect(setLocale("en")).resolves.toBe("en");
    expect(() => clearCachedQueries()).not.toThrow();
  });
});
