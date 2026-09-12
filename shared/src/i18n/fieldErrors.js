/**
 * Translatable validation messages.
 *
 * A zod schema is built once, at module scope, long before anyone has picked a
 * language - and react-hook-form holds on to the message string it produced.
 * Resolving copy at schema-build time would therefore freeze a field error in
 * whichever language was active when the module first loaded, and leave it
 * there after the user switches.
 *
 * So schemas carry a *key*, and the field renders it:
 *
 *   z.string().min(1, msg("validation:auth.nameRequired"))
 *   <FieldError>{translateFieldError(errors.name, t)}</FieldError>
 *
 * Parameters ride along in the same string because that is the only channel
 * zod gives us. The separator is deliberately ugly so it cannot collide with
 * real copy, and anything that does not parse is passed through unchanged -
 * a message written by hand, or one zod generated itself, still renders.
 */

const SEPARATOR = "::";

/**
 * Build a message a field can translate later.
 *
 * @param {string} key Namespaced i18next key, e.g. "validation:auth.emailInvalid".
 * @param {Record<string, unknown>} [params] Interpolation values.
 * @returns {string}
 */
export function msg(key, params) {
  if (!params || Object.keys(params).length === 0) return key;
  return `${key}${SEPARATOR}${JSON.stringify(params)}`;
}

/**
 * Resolve a message produced by `msg`, a react-hook-form error object, or a
 * plain string.
 *
 * @param {{ message?: string } | string | null | undefined} error
 * @param {(key: string, options?: Object) => string} t
 * @returns {string | undefined}
 */
export function translateFieldError(error, t) {
  const raw = typeof error === "string" ? error : error?.message;
  if (!raw || typeof raw !== "string") return undefined;

  const index = raw.indexOf(SEPARATOR);
  const key = index === -1 ? raw : raw.slice(0, index);

  // Only strings that look like one of our keys are translated. Zod's own
  // fallback messages ("Expected string, received number") must survive.
  if (!/^[a-z]+:[A-Za-z0-9_.]+$/.test(key)) return raw;

  let params;
  if (index !== -1) {
    try {
      params = JSON.parse(raw.slice(index + SEPARATOR.length));
    } catch {
      params = undefined;
    }
  }

  const translated = t(key, params);
  return translated === key ? raw : translated;
}
