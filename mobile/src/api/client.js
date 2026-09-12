import axios from "axios";
import { API_URL } from "@/lib/config";
import { LOCALE_HEADER, currentLocale, t } from "@chowgo/shared/i18n";

import { clearToken, getToken } from "@/lib/secureToken";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  // Without this the backend omits the token from login/register bodies and
  // every later request is silently unauthenticated. See backend/utils/clientType.js.
  headers: { "X-Client": "mobile" },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Read per request rather than set once: the header has to follow a language
  // the user switches mid-session, and it is what makes the backend render its
  // errors and push copy in the language on screen.
  config.headers[LOCALE_HEADER] = currentLocale();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

/**
 * The API returns at least four envelope shapes; `message` is the only field
 * every error path reliably sets - and the backend now localises it from the
 * `X-Locale` header above, so it is already in the right language.
 *
 * The fallbacks are what matters when there is no message: a request that never
 * reached the server, or a deployment old enough to answer with a code alone.
 *
 * @param {unknown} error
 * @param {string} [fallbackKey] Namespaced key, used when nothing else reads.
 * @returns {string}
 */
export function errorMessage(error, fallbackKey = "common:error.generic") {
  if (!error?.response) {
    return t(error?.message === "Network Error" ? "errors:byCode.NETWORK" : fallbackKey);
  }

  if (error.response.status === 429) return t("errors:byCode.RATE_LIMITED");

  const data = error.response.data || {};
  if (typeof data.message === "string" && data.message.trim()) return data.message;

  if (data.code) {
    const key = `errors:byCode.${data.code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return t(fallbackKey);
}
