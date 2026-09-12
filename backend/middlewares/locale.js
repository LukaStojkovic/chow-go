/**
 * Decide which language this request should be answered in.
 *
 * Three sources, most specific first:
 *
 *   1. `X-Locale` - what the user is actually looking at right now. Both
 *      clients send it on every request, so a language switched mid-session
 *      takes effect on the very next response.
 *   2. `User.locale` - the stored preference. Matters for the requests that
 *      carry no header because they did not come from a client at all: a cron
 *      job rendering push copy, or a webhook.
 *   3. `Accept-Language` - the browser's own list, for anonymous traffic.
 *
 * `req.locale` is set before the router runs so error middleware can read it
 * even when a route threw before touching the user.
 */

import { LOCALE_HEADER, resolveLocale } from "@chowgo/shared/i18n";

const HEADER = LOCALE_HEADER.toLowerCase();

export function attachLocale(req, _res, next) {
  req.locale = resolveLocale([
    req.headers[HEADER],
    req.query?.locale,
    req.headers["accept-language"],
  ]);
  next();
}

/**
 * Re-resolve once the user is loaded, so a stored preference beats the browser
 * header for someone who chose Serbian on a machine set to English.
 *
 * `protectedRoute` calls this after hydrating `req.user`. An explicit header
 * still wins: it is the language on screen, and the screen is the truth.
 *
 * @param {import("express").Request} req
 */
export function refineLocaleFromUser(req) {
  if (req.headers[HEADER]) return;
  if (!req.user?.locale) return;
  req.locale = resolveLocale([req.user.locale, req.locale]);
}

/**
 * The locale to render copy for a user who is not making the request - the
 * recipient of a push notification, say.
 *
 * @param {{ locale?: string } | null | undefined} user
 * @returns {string}
 */
export function localeForUser(user) {
  return resolveLocale(user?.locale);
}
