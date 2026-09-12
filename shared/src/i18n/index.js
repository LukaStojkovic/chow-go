/**
 * The platform's single i18next instance.
 *
 * It lives here, not in each client, for the same reason the pricing and
 * promotion rules do: the copy in `adapters/` and `constants.js` is shown by
 * both the web and the native app, and a second instance would mean the order
 * status on a card and the one in a push notification could disagree.
 *
 * i18next itself is platform-neutral - no DOM, no `import.meta`, no fetch - so
 * it runs unchanged under Vite, Metro/Hermes and Node. Clients add
 * `react-i18next` and bind it to *this* instance rather than creating one.
 *
 * Catalogs are imported statically. Lazy-loading two languages would trade a
 * few kilobytes for a flash of untranslated copy on every cold start, and
 * Metro cannot code-split anyway.
 */

import i18next from "i18next";

import {
  CURRENCY_CODE,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  intlLocale,
  resolveLocale,
} from "./config.js";
import en from "./locales/en/index.js";
import sr from "./locales/sr/index.js";

export const resources = { en, sr };

export const NAMESPACES = Object.keys(en);

let initialised = false;

/**
 * Boot the shared instance. Safe to call more than once - the second call only
 * changes the language, which is what a client that re-mounts wants.
 *
 * @param {{ locale?: string, debug?: boolean }} [options]
 * @returns {typeof i18next}
 */
export function initI18n({ locale, debug = false } = {}) {
  const lng = resolveLocale(locale);

  if (initialised) {
    if (i18next.language !== lng) i18next.changeLanguage(lng);
    return i18next;
  }

  i18next.init({
    resources,
    lng,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    // i18next otherwise prints a vendor advert to `console.info` on boot -
    // in every browser console, and in the backend's structured log stream.
    showSupportNotice: false,
    ns: NAMESPACES,
    defaultNS: "common",
    fallbackNS: "common",
    debug,
    // Keys are dotted paths; values never contain a colon-separated namespace
    // by accident because every lookup passes the namespace explicitly.
    nsSeparator: ":",
    keySeparator: ".",
    returnEmptyString: false,
    interpolation: {
      // React escapes for us on the web, and React Native has no HTML at all.
      // Leaving this on double-escapes apostrophes in Serbian copy.
      escapeValue: false,
    },
    react: { useSuspense: false },
  });

  registerFormatters();
  initialised = true;
  return i18next;
}

/**
 * `Intl`-backed interpolation formatters, so a catalog string can say
 * `{{total, currency}}` instead of every call site importing a formatter.
 */
function registerFormatters() {
  const cache = new Map();

  const formatter = (kind, locale, options) => {
    const key = `${kind}:${locale}:${JSON.stringify(options)}`;
    let found = cache.get(key);
    if (!found) {
      const Ctor = kind === "date" ? Intl.DateTimeFormat : Intl.NumberFormat;
      found = new Ctor(locale, options);
      cache.set(key, found);
    }
    return found;
  };

  i18next.services.formatter.add("currency", (value, lng, options) =>
    formatter("number", intlLocale(lng), {
      style: "currency",
      currency: options?.currency || CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0),
  );

  i18next.services.formatter.add("number", (value, lng, options) =>
    formatter("number", intlLocale(lng), options).format(Number(value) || 0),
  );

  i18next.services.formatter.add("date", (value, lng, options) =>
    formatter("date", intlLocale(lng), options).format(new Date(value)),
  );

  i18next.services.formatter.add("lowercase", (value, lng) =>
    String(value ?? "").toLocaleLowerCase(intlLocale(lng)),
  );
}

/**
 * Translate. The shared modules call this directly; components should prefer
 * `useTranslation()` so they re-render when the language changes.
 *
 * Falls back to returning the key when called before `initI18n`, which happens
 * only in unit-style scripts that import an adapter in isolation.
 *
 * @param {string | string[]} key
 * @param {Object} [options]
 * @returns {string}
 */
export function t(key, options) {
  if (!initialised) initI18n();
  return i18next.t(key, options);
}

/**
 * Translate with an explicit language, without touching the active one.
 * This is how the backend renders push copy for a user whose locale differs
 * from the process default.
 *
 * @param {string} locale
 * @param {string | string[]} key
 * @param {Object} [options]
 * @returns {string}
 */
export function tFor(locale, key, options) {
  if (!initialised) initI18n();
  return i18next.t(key, { ...options, lng: resolveLocale(locale) });
}

/**
 * @param {string} locale
 * @returns {Promise<string>}
 */
export async function changeLanguage(locale) {
  if (!initialised) initI18n({ locale });
  const next = resolveLocale(locale);
  if (i18next.language !== next) await i18next.changeLanguage(next);
  return next;
}

/** @returns {string} */
export function currentLocale() {
  if (!initialised) initI18n();
  return resolveLocale(i18next.resolvedLanguage || i18next.language);
}

/**
 * @param {(locale: string) => void} listener
 * @returns {() => void} Unsubscribe.
 */
export function onLocaleChange(listener) {
  if (!initialised) initI18n();
  const handler = (lng) => listener(resolveLocale(lng));
  i18next.on("languageChanged", handler);
  return () => i18next.off("languageChanged", handler);
}

export { i18next };
export * from "./config.js";
