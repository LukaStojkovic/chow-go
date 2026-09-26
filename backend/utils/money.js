// One implementation for the backend, the checkout preview and the seller
// forms: a total the server charges must be the total the client showed.
import { toMoney } from "@chowgo/shared/money";

export { fromCents, isWholeCents, lineTotal, sumMoney, toCents, toMoney } from "@chowgo/shared/money";
export { CURRENCY_CODE } from "@chowgo/shared/i18n/config";

// Schema setter. Leaves empty and non-numeric input alone, so an optional
// field stays unset and "abc" still fails the cast instead of becoming 0.
export function moneySetter(value) {
  if (value === undefined || value === null || value === "") return value;
  const n = Number(value);
  return Number.isFinite(n) ? toMoney(n) : value;
}
