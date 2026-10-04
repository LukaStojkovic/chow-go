import { describe, expect, it } from "vitest";

import {
  DEFAULT_CURRENCY,
  currencyForCountry,
  fractionDigitsFor,
  normalizeCurrency,
} from "../src/currency.js";

describe("normalizeCurrency", () => {
  it("uppercases and trims supported codes", () => {
    expect(normalizeCurrency(" eur ")).toBe("EUR");
    expect(normalizeCurrency("usd")).toBe("USD");
  });

  it("falls back to the default for anything unsupported", () => {
    expect(normalizeCurrency("GBP")).toBe(DEFAULT_CURRENCY);
    expect(normalizeCurrency(null)).toBe(DEFAULT_CURRENCY);
    expect(normalizeCurrency(42)).toBe(DEFAULT_CURRENCY);
  });
});

describe("currencyForCountry", () => {
  it("maps Serbia in either language", () => {
    expect(currencyForCountry("Serbia")).toBe("RSD");
    expect(currencyForCountry(" Srbija ")).toBe("RSD");
    expect(currencyForCountry("RS")).toBe("RSD");
  });

  it("defaults for unknown countries", () => {
    expect(currencyForCountry("Germany")).toBe(DEFAULT_CURRENCY);
    expect(currencyForCountry(undefined)).toBe(DEFAULT_CURRENCY);
  });
});

describe("fractionDigitsFor", () => {
  it("writes dinars whole and euros/dollars with cents", () => {
    expect(fractionDigitsFor("RSD")).toBe(0);
    expect(fractionDigitsFor("EUR")).toBe(2);
    expect(fractionDigitsFor("usd")).toBe(2);
    expect(fractionDigitsFor("nope")).toBe(0);
  });
});
