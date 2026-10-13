import { CATEGORY_VALUES, CUISINE_VALUES } from "./constants.js";
import { normalizeCurrency } from "./currency.js";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./i18n/config.js";

export const COLLECTION_LIMITS = {
  titleLength: 60,
  subtitleLength: 120,
  slugLength: 40,
  pins: 30,
  maxItems: 30,
  defaultItems: 12,
  minItems: 3,
  homeRails: 8,
  maxNewWithinDays: 365,
};

export const COLLECTION_KINDS = ["restaurants", "dishes"];
export const COLLECTION_STATUSES = ["draft", "published", "archived"];
export const COLLECTION_SORTS = {
  restaurants: ["rating", "distance", "newest", "popular"],
  dishes: ["popular", "price", "discount", "rating", "distance", "newest"],
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID = /^[a-f0-9]{24}$/i;
const CATEGORY_SET = new Set(CATEGORY_VALUES.filter((c) => c.id !== "all").map((c) => c.value));

const fail = (code, details = {}) => ({ error: { code, ...details } });

export function slugify(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, COLLECTION_LIMITS.slugLength)
    .replace(/-+$/g, "");
}

function localized(input, max, required) {
  const source = typeof input === "string" ? { [DEFAULT_LOCALE]: input } : input && typeof input === "object" ? input : {};
  const out = {};
  for (const locale of SUPPORTED_LOCALES) {
    const text = typeof source[locale] === "string" ? source[locale].replace(/\s+/g, " ").trim() : "";
    if (text.length > max) return { tooLong: locale };
    if (text) out[locale] = text;
  }
  if (required && !out[DEFAULT_LOCALE]) return { missing: DEFAULT_LOCALE };
  return { value: out };
}

/** The text for a locale, falling back to the default language. */
export function localizedText(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value[DEFAULT_LOCALE] || Object.values(value).find(Boolean) || "";
}

function idList(input, field) {
  if (input === undefined || input === null || input === "") return { value: [] };
  if (!Array.isArray(input)) return { field };
  const ids = [...new Set(input.map((x) => String(x?._id ?? x?.id ?? x ?? "")))];
  if (ids.some((id) => !ID.test(id))) return { field };
  if (ids.length > COLLECTION_LIMITS.pins) return { field, max: COLLECTION_LIMITS.pins };
  return { value: ids };
}

function optionalNumber(value, { min, max, integer = false }) {
  if (value === undefined || value === null || value === "") return { value: null };
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) return { invalid: true };
  return { value: n };
}

function optionalDate(value) {
  if (value === undefined || value === null || value === "") return { value: null };
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? { invalid: true } : { value: date };
}

/**
 * Validates an admin's collection. Returns `{ collection }` or `{ error: { code, field? } }`.
 * Codes: COLLECTION_TITLE, COLLECTION_SLUG, COLLECTION_KIND, COLLECTION_RULE, COLLECTION_PINS, COLLECTION_DATES.
 */
export function normalizeCollectionInput(input = {}) {
  const kind = input.kind;
  if (!COLLECTION_KINDS.includes(kind)) return fail("COLLECTION_KIND", { field: "kind" });

  const title = localized(input.title, COLLECTION_LIMITS.titleLength, true);
  if (!title.value) return fail("COLLECTION_TITLE", { field: "title", max: COLLECTION_LIMITS.titleLength });
  const subtitle = localized(input.subtitle, COLLECTION_LIMITS.subtitleLength, false);
  if (!subtitle.value) return fail("COLLECTION_TITLE", { field: "subtitle", max: COLLECTION_LIMITS.subtitleLength });

  const slug = input.slug ? String(input.slug).trim().toLowerCase() : slugify(title.value[DEFAULT_LOCALE]);
  if (!slug || slug.length > COLLECTION_LIMITS.slugLength || !SLUG.test(slug)) return fail("COLLECTION_SLUG", { field: "slug" });

  const rawRules = input.rules && typeof input.rules === "object" ? input.rules : {};
  const rule = (field) => fail("COLLECTION_RULE", { field: `rules.${field}` });

  const cuisines = Array.isArray(rawRules.cuisines) ? [...new Set(rawRules.cuisines.map((c) => String(c).toLowerCase()))] : [];
  if (cuisines.some((c) => !CUISINE_VALUES.includes(c))) return rule("cuisines");
  const categories = Array.isArray(rawRules.categories) ? [...new Set(rawRules.categories.map(String))] : [];
  if (categories.some((c) => !CATEGORY_SET.has(c))) return rule("categories");

  const minRating = optionalNumber(rawRules.minRating, { min: 1, max: 5 });
  if (minRating.invalid) return rule("minRating");
  const maxPrice = optionalNumber(rawRules.maxPrice, { min: 1, max: 1_000_000 });
  if (maxPrice.invalid || (maxPrice.value !== null && kind !== "dishes")) return rule("maxPrice");
  const newWithinDays = optionalNumber(rawRules.newWithinDays, { min: 1, max: COLLECTION_LIMITS.maxNewWithinDays, integer: true });
  if (newWithinDays.invalid) return rule("newWithinDays");
  const sort = rawRules.sort ?? COLLECTION_SORTS[kind][0];
  if (!COLLECTION_SORTS[kind].includes(sort)) return rule("sort");

  const pins = idList(input.pins, "pins");
  if (!pins.value) return fail("COLLECTION_PINS", { field: "pins", ...(pins.max ? { max: pins.max } : {}) });
  const manualOnly = input.manualOnly === true || input.manualOnly === "true";
  if (manualOnly && pins.value.length === 0) return fail("COLLECTION_PINS", { field: "pins" });

  const maxItems = optionalNumber(input.maxItems, { min: COLLECTION_LIMITS.minItems, max: COLLECTION_LIMITS.maxItems, integer: true });
  if (maxItems.invalid) return rule("maxItems");

  const startsAt = optionalDate(input.startsAt);
  const endsAt = optionalDate(input.endsAt);
  if (startsAt.invalid || endsAt.invalid || (startsAt.value && endsAt.value && endsAt.value <= startsAt.value)) {
    return fail("COLLECTION_DATES", { field: "endsAt" });
  }

  const coverImage = typeof input.coverImage === "string" && /^https:\/\/\S+$/.test(input.coverImage.trim()) ? input.coverImage.trim() : null;

  return {
    collection: {
      kind,
      slug,
      title: title.value,
      subtitle: subtitle.value,
      coverImage,
      manualOnly,
      pins: pins.value,
      maxItems: maxItems.value ?? COLLECTION_LIMITS.defaultItems,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      rules: {
        cuisines,
        categories,
        minRating: minRating.value,
        maxPrice: maxPrice.value,
        currency: maxPrice.value !== null ? normalizeCurrency(rawRules.currency) : null,
        onlyDeals: rawRules.onlyDeals === true || rawRules.onlyDeals === "true",
        openNow: rawRules.openNow === true || rawRules.openNow === "true",
        newWithinDays: newWithinDays.value,
        sort,
      },
    },
  };
}

/** True while a published collection's dates include `now`. */
export function isCollectionLive(collection, now = new Date()) {
  if (!collection || collection.status !== "published") return false;
  if (collection.startsAt && new Date(collection.startsAt) > now) return false;
  if (collection.endsAt && new Date(collection.endsAt) <= now) return false;
  return true;
}
