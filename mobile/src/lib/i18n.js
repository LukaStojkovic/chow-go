/**
 * Native i18n bootstrap.
 *
 * The i18next instance lives in `@chowgo/shared/i18n`, shared with the web and
 * the backend. This module only decides which language the app opens in and
 * keeps that choice across launches.
 *
 * Unlike the web there is no synchronous storage, so the stored preference is
 * read in an async step the splash screen waits on - starting in the device
 * language and correcting a tick later would flash the wrong copy over the
 * whole first screen.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import {
  LOCALE_STORAGE_KEY,
  changeLanguage as changeSharedLanguage,
  currentLocale,
  initI18n,
  resolveLocale,
} from "@chowgo/shared/i18n";

/**
 * The device's language list, most-preferred first.
 *
 * `getLocales()` gives `languageTag` ("sr-Latn-RS") and `languageCode` ("sr");
 * both are passed because a device configured for Serbian (Montenegro) reports
 * a tag `resolveLocale` has to strip down to "sr".
 *
 * @returns {string[]}
 */
function deviceLocales() {
  try {
    return getLocales().flatMap((locale) =>
      [locale.languageTag, locale.languageCode].filter(Boolean),
    );
  } catch {
    // Older Androids without a configured locale list.
    return [];
  }
}

let queryClient = null;

/**
 * @param {import("@tanstack/react-query").QueryClient} client
 */
export function registerQueryClient(client) {
  queryClient = client;
}

/**
 * Read the stored preference and boot i18next with it.
 *
 * Awaited before the splash screen hides. A storage failure is not worth
 * blocking a cold start over - the device language is a good default.
 *
 * @returns {Promise<string>} The locale the app started in.
 */
export async function setupI18n() {
  let stored = null;
  try {
    stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    stored = null;
  }

  const locale = resolveLocale([stored, ...deviceLocales()]);
  initI18n({ locale, debug: __DEV__ });
  return locale;
}

/**
 * Switch language and persist the choice.
 *
 * The React Query cache is dropped for the same reason as on the web: the
 * shared adapters resolve their copy when they run, so a cached order view
 * would keep the labels it was built with. The refetch also picks up the
 * backend's own error copy in the new language, since `X-Locale` now differs.
 *
 * @param {string} next
 * @returns {Promise<string>}
 */
export async function setLocale(next) {
  const applied = await changeSharedLanguage(next);

  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, applied);
  } catch {
    // Preference is session-only; not worth interrupting the user.
  }

  queryClient?.invalidateQueries();
  return applied;
}

export { currentLocale };
