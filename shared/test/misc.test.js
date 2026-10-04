import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADDRESS_LABEL_VALUES,
  CATEGORY_VALUES,
  CUISINE_VALUES,
  addressLabelText,
  addressLabels,
  addressTypes,
  categoryOptions,
  cuisineLabel,
  cuisineOptions,
  deliveryTimeFilters,
  deliveryTypes,
  matchAddressLabelValue,
  paymentMethods,
  sortOptions,
  vehicleOptions,
} from "../src/constants.js";
import { formatDateAgo } from "../src/dates.js";
import { t } from "../src/i18n/index.js";
import { LEGAL_DETAILS, LEGAL_DOCUMENTS, checkLegalPlaceholders, getLegalDocument } from "../src/legal/index.js";
import { generateNameInitials } from "../src/strings.js";

afterEach(() => {
  vi.useRealTimers();
});

const untranslated = (label) => /^[a-z]+:/.test(label);

describe("constants", () => {
  it("every option builder resolves real catalog copy", () => {
    const lists = [
      categoryOptions(t),
      vehicleOptions(t),
      addressTypes(t),
      addressLabels(t),
      cuisineOptions(t),
      sortOptions(t),
      deliveryTimeFilters(t),
      deliveryTypes(t),
      paymentMethods(t),
    ];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(0);
      for (const option of list) {
        expect(untranslated(option.label), option.label).toBe(false);
        if (option.description) expect(untranslated(option.description), option.description).toBe(false);
      }
    }
    expect(categoryOptions(t).map((c) => c.value)).toEqual(CATEGORY_VALUES.map((c) => c.value));
    expect(cuisineOptions(t).map((c) => c.value)).toEqual(CUISINE_VALUES);
  });

  it("labels cuisines case-insensitively and shows unknown ones verbatim", () => {
    expect(cuisineLabel(t, "Italian")).toBe(cuisineLabel(t, "italian"));
    expect(cuisineLabel(t, " Georgian ")).toBe("Georgian");
    expect(cuisineLabel(t, "")).toBe("Restaurant");
    expect(cuisineLabel(t, null)).toBe("Restaurant");
  });

  it("matches stored address labels case-insensitively", () => {
    expect(matchAddressLabelValue("home")).toBe("Home");
    expect(matchAddressLabelValue("Cottage")).toBe("Other");
    expect(matchAddressLabelValue(null)).toBe("Other");
    expect(ADDRESS_LABEL_VALUES.map((o) => o.value)).toContain("Home");
  });

  it("translates known address labels and shows custom ones as typed", () => {
    expect(untranslated(addressLabelText(t, "work"))).toBe(false);
    expect(addressLabelText(t, " Grandma's ")).toBe("Grandma's");
    expect(addressLabelText(t, undefined)).toBe("");
  });
});

describe("formatDateAgo", () => {
  it("reads recency in hours, then days, then a date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(formatDateAgo("2026-06-15T11:30:00Z")).toBe("Just now");
    expect(formatDateAgo("2026-06-15T09:00:00Z")).toBe("3h ago");
    expect(formatDateAgo("2026-06-12T12:00:00Z")).toBe("3d ago");
    expect(formatDateAgo("2026-06-01T12:00:00Z")).toBe("1 Jun");
  });

  it("is empty for missing or invalid input", () => {
    expect(formatDateAgo(null)).toBe("");
    expect(formatDateAgo("garbage")).toBe("");
  });
});

describe("generateNameInitials", () => {
  it("takes up to two initials", () => {
    expect(generateNameInitials("marko petrović")).toBe("MP");
    expect(generateNameInitials("Ana Marija Jovanović")).toBe("AM");
    expect(generateNameInitials("Cher")).toBe("C");
    expect(generateNameInitials()).toBe("");
  });
});

describe("legal documents", () => {
  it("loads each document in each language, falling back to English", () => {
    for (const kind of LEGAL_DOCUMENTS) {
      const en = getLegalDocument(kind, "en");
      const sr = getLegalDocument(kind, "sr-Latn");
      expect(en.sections.length).toBeGreaterThan(0);
      expect(sr.title).not.toBe(en.title);
      expect(getLegalDocument(kind, "de").title).toBe(en.title);
      expect(getLegalDocument(kind, undefined).title).toBe(en.title);
    }
    expect(getLegalDocument("cookies", "en")).toBeNull();
  });

  it("substitutes the operator's details into every block", () => {
    const text = JSON.stringify(getLegalDocument("privacy", "en"));
    for (const key of Object.keys(LEGAL_DETAILS)) {
      expect(text).not.toContain(`{${key}}`);
    }
  });

  it("lists placeholders still in brackets", () => {
    const pending = checkLegalPlaceholders();
    const bracketed = Object.entries(LEGAL_DETAILS).filter(([, v]) => /^\[.*\]$/.test(v));
    expect(pending).toEqual(bracketed.map(([k]) => k));
  });
});
