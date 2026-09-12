import { t, tFor } from "@chowgo/shared/i18n";

/**
 * An operational failure, with copy the requesting user can read.
 *
 * `message` may be either a literal sentence or a key into the shared
 * `errors` catalog ("errors:order.notFound"). The key form is preferred:
 * `errorController` renders it in the locale the request carried, so a Serbian
 * customer is told "Ta porudžbina nije pronađena" rather than being handed
 * English by a server that has no idea who is reading.
 *
 * A literal message still works - throwing one is not a bug, it just cannot be
 * translated - so this can be adopted a service at a time.
 */
export class AppError extends Error {
  /**
   * @param {string} message A catalog key, or a literal sentence.
   * @param {number} statusCode
   * @param {string} [code] Stable machine-readable identifier for clients.
   * @param {Object} [params] Interpolation values for the catalog key.
   */
  constructor(message, statusCode, code, params) {
    // `super` needs *something* readable: a log line, a Sentry issue and a
    // stack trace all print `error.message`, and a bare key there would make
    // the backend's own diagnostics harder to read than they were before.
    super(AppError.isKey(message) ? tFor("en", message, params) : message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if (code) this.code = code;
    if (AppError.isKey(message)) {
      this.messageKey = message;
      if (params) this.messageParams = params;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Does this look like a catalog key rather than prose?
   *
   * Deliberately strict: a sentence containing a colon ("Access denied: ...")
   * must not be mistaken for one and silently replaced by its own key.
   *
   * @param {unknown} value
   * @returns {boolean}
   */
  static isKey(value) {
    return typeof value === "string" && /^[a-z]+:[A-Za-z0-9_.]+$/.test(value);
  }

  /**
   * The message in a given locale, falling back to whatever `super` was given.
   *
   * @param {string} [locale]
   * @returns {string}
   */
  localised(locale) {
    if (!this.messageKey) return this.message;
    return locale
      ? tFor(locale, this.messageKey, this.messageParams)
      : t(this.messageKey, this.messageParams);
  }
}
