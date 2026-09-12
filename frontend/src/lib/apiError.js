/**
 * Turning an axios failure into something a person can read.
 *
 * The backend localises its own messages from `X-Locale`, so `data.message` is
 * already in the right language and is what we show. The fallbacks matter when
 * it is not there at all: a network failure never reaches the server, a proxy
 * error page has no JSON body, and an older deployment may answer with a code
 * and an English sentence.
 *
 * `errors:byCode.*` is the middle layer - a known machine-readable `code`
 * always has local copy, so a stale server cannot put English in front of a
 * Serbian user.
 */

import { t } from "@chowgo/shared/i18n";

/**
 * @param {unknown} error An axios error, or anything thrown.
 * @param {{ fallbackKey?: string }} [options]
 * @returns {string}
 */
export function apiErrorMessage(error, { fallbackKey = "common:error.generic" } = {}) {
  const response = error?.response;

  // No response at all: DNS failure, timeout, offline, CORS.
  if (!response) {
    if (error?.code === "ERR_CANCELED") return "";
    return t("errors:byCode.NETWORK");
  }

  if (response.status === 429) return t("errors:byCode.RATE_LIMITED");

  const data = response.data || {};

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (data.code) {
    const key = `errors:byCode.${data.code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return t(fallbackKey);
}

/**
 * The per-field map the backend sends with `VALIDATION_FAILED`, for forms that
 * want to attach server-side errors to their inputs.
 *
 * @param {unknown} error
 * @returns {Record<string, string> | null}
 */
export function apiErrorFields(error) {
  const fields = error?.response?.data?.fields;
  return fields && typeof fields === "object" ? fields : null;
}
