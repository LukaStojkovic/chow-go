import { CATEGORY_VALUES, CUISINE_VALUES } from "./constants.js";
import { SUPPORTED_LOCALES, tFor } from "./i18n/index.js";

export const SEARCH_LIMITS = {
  minLength: 2,
  maxLength: 80,
  suggestions: 8,
  pageSize: 10,
  dishes: 20,
};

const FOLDS = { đ: "d", Đ: "d", ø: "o", Ø: "o", ł: "l", Ł: "l" };

/** Lower case, accents stripped, one character per character, so "Ćevapi" and "cevapi" compare equal. */
export function foldText(value) {
  return String(value ?? "")
    .replace(/[đĐøØłŁ]/g, (ch) => FOLDS[ch])
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function normalizeSearchTerm(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_LIMITS.maxLength);
}

const CLASSES = {
  a: "aàáâãäå", c: "cčćç", d: "dđ", e: "eèéêë", i: "iìíîï", n: "nñ",
  o: "oòóôõöø", s: "sšś", u: "uùúûü", y: "yýÿ", z: "zžźż", l: "lł",
};

/**
 * A regex source that finds the term whatever accents either side used: "cevap" matches "ćevapi",
 * and "ćevap" matches "cevapi". Use with the "i" flag.
 */
export function searchPattern(term) {
  return [...foldText(normalizeSearchTerm(term))]
    .map((ch) => {
      const cls = CLASSES[ch];
      if (cls) return `[${cls}${cls.toUpperCase()}]`;
      return ch.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
    })
    .join("");
}

/** 3 starts the text, 2 starts a word, 1 anywhere inside, 0 no match. */
export function matchRank(text, term) {
  const haystack = foldText(text);
  const needle = foldText(normalizeSearchTerm(term));
  if (!needle) return 0;
  const at = haystack.indexOf(needle);
  if (at < 0) return 0;
  if (at === 0) return 3;
  const wordStart = new RegExp(`(^|[^\\p{L}\\p{N}])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u");
  return wordStart.test(haystack) ? 2 : 1;
}

/** Splits text around the first match, for highlighting. `null` when the term does not occur. */
export function highlightMatch(text, term) {
  const source = String(text ?? "");
  const needle = foldText(normalizeSearchTerm(term));
  if (!needle) return null;
  const at = foldText(source).indexOf(needle);
  if (at < 0) return null;
  return {
    before: source.slice(0, at),
    match: source.slice(at, at + needle.length),
    after: source.slice(at + needle.length),
  };
}

function labelsFor(key, value) {
  return SUPPORTED_LOCALES.map((locale) => tFor(locale, key, { defaultValue: value }));
}

/** Cuisine slugs whose value or label in any language matches the term, best first. */
export function matchingCuisines(term) {
  return CUISINE_VALUES.map((slug) => ({
    slug,
    rank: Math.max(matchRank(slug.replace(/_/g, " "), term), ...labelsFor(`common:taxonomy.cuisine.${slug}`, slug).map((l) => matchRank(l, term))),
  }))
    .filter((c) => c.rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .map((c) => c.slug);
}

/** Dish category values ("Pizza") whose value or label in any language matches the term. */
export function matchingCategories(term) {
  return CATEGORY_VALUES.filter((c) => c.id !== "all")
    .filter((c) => [c.value, ...labelsFor(`common:taxonomy.category.${c.value}`, c.value)].some((l) => matchRank(l, term) > 0))
    .map((c) => c.value);
}
