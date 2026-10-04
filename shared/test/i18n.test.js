import { describe, expect, it, vi } from "vitest";

import {
  changeLanguage,
  currentLocale,
  i18next,
  initI18n,
  intlLocale,
  localeDescriptor,
  onLocaleChange,
  resolveLocale,
  t,
  tFor,
} from "../src/i18n/index.js";

describe("resolveLocale", () => {
  it("drops region and script subtags", () => {
    expect(resolveLocale("sr-Latn-RS")).toBe("sr");
    expect(resolveLocale("en-US")).toBe("en");
  });

  it("reads an Accept-Language header and candidate lists", () => {
    expect(resolveLocale("de-DE,sr;q=0.9,en;q=0.8")).toBe("sr");
    expect(resolveLocale([null, "", 42, "fr", "SR"])).toBe("sr");
  });

  it("falls back when nothing is supported", () => {
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale(undefined, "sr")).toBe("sr");
    expect(resolveLocale("fr", "de")).toBe("en");
  });
});

describe("localeDescriptor / intlLocale", () => {
  it("maps to Latin-script Serbian for Intl", () => {
    expect(intlLocale("sr")).toBe("sr-Latn-RS");
    expect(intlLocale("en")).toBe("en-GB");
  });

  it("falls back to the default locale", () => {
    expect(localeDescriptor("fr").code).toBe("en");
  });
});

describe("language switching", () => {
  it("changes the active language and notifies listeners", async () => {
    const listener = vi.fn();
    const off = onLocaleChange(listener);

    await changeLanguage("sr-RS");
    expect(currentLocale()).toBe("sr");
    expect(listener).toHaveBeenCalledWith("sr");

    off();
    await changeLanguage("en");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("re-initialising only changes the language", () => {
    expect(initI18n({ locale: "sr" })).toBe(i18next);
    expect(currentLocale()).toBe("sr");
  });
});

describe("tFor", () => {
  it("translates in another language without changing the active one", () => {
    expect(tFor("sr", "restaurant:hours.closed")).not.toBe(t("restaurant:hours.closed"));
    expect(currentLocale()).toBe("en");
  });
});

describe("interpolation formatters", () => {
  const render = (text, options, lng = "en") => i18next.t(text, { ...options, lng, defaultValue: text });

  it("formats currency in the given or default currency", () => {
    expect(render("{{v, currency}}", { v: 12.5, formatParams: { v: { currency: "EUR" } } })).toBe("€12.50");
    expect(render("{{v, currency}}", { v: 1234 })).toContain("1,234");
    expect(render("{{v, currency}}", { v: 1234 })).not.toMatch(/\.\d/);
  });

  it("formats numbers and lowercases per locale", () => {
    expect(render("{{v, number}}", { v: 1204 })).toBe("1,204");
    expect(render("{{v, number}}", { v: 1204 }, "sr")).toBe("1.204");
    expect(render("{{v, lowercase}}", { v: "PIZZA" })).toBe("pizza");
  });

  it("formats dates", () => {
    const text = render("{{v, date}}", { v: "2026-06-15T12:00:00Z", formatParams: { v: { year: "numeric" } } });
    expect(text).toBe("2026");
  });
});
