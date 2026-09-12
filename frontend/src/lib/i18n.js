/**
 * Web i18n bootstrap.
 *
 * The i18next instance itself lives in `@chowgo/shared/i18n` - this module
 * only decides which language the browser should start in, keeps that choice
 * where the next visit can find it, and wires the parts of the web app that
 * are not React: the `<html lang>` attribute, the axios header the backend
 * reads, and the React Query cache.
 *
 * Called from `main.jsx` before the first render, so nothing flashes English
 * on the way to Serbian.
 */

import {
  LOCALE_STORAGE_KEY,
  changeLanguage as changeSharedLanguage,
  currentLocale,
  initI18n,
  intlLocale,
  resolveLocale,
} from "@chowgo/shared/i18n";

/**
 * Storage can throw outright in a locked-down browser (Safari private mode,
 * third-party-cookie blocking in an iframe), so every access is guarded and a
 * failure just means the preference does not survive the tab.
 *
 * @returns {string | null}
 */
function storedLocale() {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** @param {string} locale */
function persistLocale(locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Preference is session-only. Not worth telling the user about.
  }
}

/**
 * What language this visit should open in.
 *
 * A stored choice always wins - someone who picked English on a Serbian
 * machine meant it. Otherwise the browser's list decides, and `resolveLocale`
 * strips region and script subtags so "sr-Latn-RS" and "sr-Cyrl-ME" both land
 * on Serbian.
 *
 * @returns {string}
 */
export function detectLocale() {
  return resolveLocale([storedLocale(), ...(navigator.languages || [navigator.language])]);
}

/**
 * Reflect the language on the document.
 *
 * `lang` is what a screen reader uses to pick a voice and what the browser
 * uses for hyphenation and spellcheck, so a Serbian page announced by an
 * English synthesiser is a real accessibility bug, not a cosmetic one.
 *
 * @param {string} locale
 */
function syncDocumentLanguage(locale) {
  document.documentElement.lang = intlLocale(locale);
}

let queryClient = null;

/**
 * Let the language switcher clear cached view models.
 *
 * The adapters in `@chowgo/shared/adapters` resolve their copy when they run,
 * and React Query memoises whatever they returned against the query data - so
 * an order card keeps its old status label until something makes the query
 * recompute. Invalidating is the cheapest way to guarantee it: a language
 * switch is rare and deliberate, and the refetch also picks up server-rendered
 * error and notification copy in the new language.
 *
 * @param {import("@tanstack/react-query").QueryClient} client
 */
export function registerQueryClient(client) {
  queryClient = client;
}

/**
 * Boot i18next. Idempotent.
 *
 * @returns {string} The locale the app started in.
 */
export function setupI18n() {
  const locale = detectLocale();
  initI18n({ locale, debug: import.meta.env.DEV });
  syncDocumentLanguage(locale);
  return locale;
}

/**
 * Switch language, persist the choice, and bring the rest of the app with it.
 *
 * @param {string} next
 * @returns {Promise<string>} The locale actually applied.
 */
export async function setLocale(next) {
  const applied = await changeSharedLanguage(next);
  persistLocale(applied);
  syncDocumentLanguage(applied);
  queryClient?.invalidateQueries();
  return applied;
}

export { currentLocale };
