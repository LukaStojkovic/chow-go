/**
 * Locale configuration: the one place that knows which languages exist.
 *
 * Kept free of the i18next instance so the backend, which localises push copy
 * without booting a client runtime, can import the list and the resolver
 * without pulling in the catalogs.
 */

/**
 * @typedef {Object} LocaleDescriptor
 * @property {string} code       BCP 47 tag used by i18next and `Intl`.
 * @property {string} label      The language's name in its own language.
 * @property {string} englishLabel
 * @property {string} flag
 * @property {string} numberLocale `Intl` tag for numbers, dates and currency.
 */

/** @type {LocaleDescriptor[]} */
export const LOCALES = [
  {
    code: "en",
    label: "English",
    englishLabel: "English",
    flag: "🇬🇧",
    numberLocale: "en-GB",
  },
  {
    code: "sr",
    label: "Srpski",
    englishLabel: "Serbian",
    flag: "🇷🇸",
    // Latin script. `sr-Latn-RS` is what `Intl` wants; a bare "sr" resolves to
    // Cyrillic on some ICU builds, which would give Cyrillic month names next
    // to Latin copy.
    numberLocale: "sr-Latn-RS",
  },
];

export const SUPPORTED_LOCALES = LOCALES.map((locale) => locale.code);

export const DEFAULT_LOCALE = "en";

/** Where the chosen locale is stored on each client. */
export const LOCALE_STORAGE_KEY = "chowgo.locale";

/** Header the clients send so the backend can localise its own copy. */
export const LOCALE_HEADER = "X-Locale";

/**
 * Pick the first supported locale out of a list of candidates.
 *
 * Candidates arrive from wildly different places - a stored preference, an
 * `Accept-Language` header, `navigator.languages`, Expo's device locales - so
 * anything unusable is skipped rather than treated as an error. Region and
 * script subtags are dropped ("sr-Latn-RS" and "sr-Cyrl" both resolve to "sr"),
 * which is what makes a device set to Serbian (Montenegro) still get Serbian.
 *
 * @param {(string | null | undefined)[] | string | null | undefined} candidates
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveLocale(candidates, fallback = DEFAULT_LOCALE) {
  const list = Array.isArray(candidates) ? candidates : [candidates];

  for (const candidate of list) {
    if (!candidate || typeof candidate !== "string") continue;

    // An Accept-Language header arrives as "sr-Latn-RS,sr;q=0.9,en;q=0.8".
    for (const part of candidate.split(",")) {
      const tag = part.split(";")[0].trim().toLowerCase();
      if (!tag) continue;

      const base = tag.split("-")[0];
      if (SUPPORTED_LOCALES.includes(tag)) return tag;
      if (SUPPORTED_LOCALES.includes(base)) return base;
    }
  }

  return SUPPORTED_LOCALES.includes(fallback) ? fallback : DEFAULT_LOCALE;
}

/**
 * @param {string} code
 * @returns {LocaleDescriptor}
 */
export function localeDescriptor(code) {
  return (
    LOCALES.find((locale) => locale.code === code) ||
    LOCALES.find((locale) => locale.code === DEFAULT_LOCALE)
  );
}

/**
 * The `Intl` tag to format numbers and dates with for a given UI language.
 *
 * @param {string} code
 * @returns {string}
 */
export function intlLocale(code) {
  return localeDescriptor(code).numberLocale;
}

/**
 * The platform's currency. Language and currency are deliberately separate:
 * switching the UI to Serbian must not reprice an order, because the amounts
 * on `Order` are stored as plain numbers in one currency. Only the *formatting*
 * of that amount follows the locale (separators and symbol placement).
 */
export const CURRENCY_CODE = "USD";
