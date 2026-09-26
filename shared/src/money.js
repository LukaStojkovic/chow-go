/**
 * Money arithmetic in whole cents.
 *
 * Amounts are stored and sent as decimal numbers in `CURRENCY_CODE`, always
 * a whole number of cents. Adding them as floats is what produced
 * 24.299999999999997, and rounding with `+ Number.EPSILON` still turned
 * 1.005 into 1.00. Every sum and product here goes through integer cents, so
 * the backend, the checkout preview and a payment provider (which wants
 * minor units) agree to the cent.
 */

/** @param {number} value @returns {number} integer cents */
export function toCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const scaled = Number((Math.abs(n) * 100).toPrecision(12));
  return Math.sign(n) * Math.round(scaled);
}

/** @param {number} cents @returns {number} */
export function fromCents(cents) {
  return Math.round(cents) / 100;
}

/** Round to cents. @param {number} value @returns {number} */
export function toMoney(value) {
  return fromCents(toCents(value));
}

/** Exact sum of amounts. @param {...number} values @returns {number} */
export function sumMoney(...values) {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0));
}

/** Price times a whole quantity. @param {number} price @param {number} quantity */
export function lineTotal(price, quantity) {
  return fromCents(toCents(price) * (Number(quantity) || 0));
}

/** @param {number} value @returns {boolean} */
export function isWholeCents(value) {
  const n = Number(value);
  return Number.isFinite(n) && toMoney(n) === n;
}
