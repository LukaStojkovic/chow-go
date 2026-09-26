/**
 * Currencies the platform prices in.
 *
 * A currency belongs to the restaurant, not to whoever is looking: the seller
 * prices in it and the courier collects it at the door, so a visitor from
 * abroad sees the same amount the courier will ask for. The viewer's language
 * only changes separators and symbol placement.
 */

export const DEFAULT_CURRENCY = "RSD";

/** Display precision. Dinar prices are written whole ("250 RSD"). */
export const CURRENCIES = {
  RSD: { fractionDigits: 0 },
  EUR: { fractionDigits: 2 },
  USD: { fractionDigits: 2 },
};

const COUNTRY_CURRENCY = {
  serbia: "RSD",
  srbija: "RSD",
  rs: "RSD",
};

/** @param {string | null | undefined} code */
export function normalizeCurrency(code) {
  const upper = typeof code === "string" ? code.trim().toUpperCase() : "";
  return CURRENCIES[upper] ? upper : DEFAULT_CURRENCY;
}

/** @param {string | null | undefined} country */
export function currencyForCountry(country) {
  const key = typeof country === "string" ? country.trim().toLowerCase() : "";
  return COUNTRY_CURRENCY[key] ?? DEFAULT_CURRENCY;
}

/** @param {string | null | undefined} code */
export function fractionDigitsFor(code) {
  return CURRENCIES[normalizeCurrency(code)].fractionDigits;
}
