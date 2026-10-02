import { fromCents, toCents, toMoney } from "./money.js";

export const PROMO_LIMITS = {
  minCodeLength: 4,
  maxCodeLength: 24,
  maxPercentOff: 90,
  maxLabelLength: 60,
  maxActivePerRestaurant: 20,
};

export const PROMO_TYPES = ["percentage", "fixed", "free_delivery"];
export const RESTAURANT_PROMO_TYPES = ["percentage", "fixed"];
export const PROMO_STATUSES = ["active", "paused", "archived"];

export const PROMO_CODE_PATTERN = /^[A-Z0-9-]+$/;

export function normalizeCode(code) {
  return typeof code === "string" ? code.trim().toUpperCase().replace(/\s+/g, "") : "";
}

export function isValidCode(code) {
  const normalized = normalizeCode(code);
  return (
    normalized.length >= PROMO_LIMITS.minCodeLength &&
    normalized.length <= PROMO_LIMITS.maxCodeLength &&
    PROMO_CODE_PATTERN.test(normalized)
  );
}

export function computePromoDiscount({ promo, subtotal, deliveryFee = 0 }) {
  if (!promo) return 0;
  const subtotalCents = Math.max(0, toCents(subtotal));
  let cents = 0;

  if (promo.type === "percentage") {
    const pct = Math.min(PROMO_LIMITS.maxPercentOff, Math.max(0, Number(promo.value) || 0));
    cents = Math.floor((subtotalCents * pct) / 100);
    if (Number(promo.maxDiscount) > 0) cents = Math.min(cents, toCents(promo.maxDiscount));
  } else if (promo.type === "fixed") {
    cents = Math.max(0, toCents(promo.value));
  } else if (promo.type === "free_delivery") {
    return toMoney(Math.max(0, Number(deliveryFee) || 0));
  }

  return fromCents(Math.min(cents, subtotalCents));
}

export function promoDiscountLabel(t, promo, formatPrice) {
  if (!promo) return "";
  const currency = promo.currency;
  if (promo.type === "free_delivery") return t("promo:discount.free_delivery");
  if (promo.type === "fixed") {
    return t("promo:discount.fixed", { amount: formatPrice(promo.value, { currency }) });
  }
  return Number(promo.maxDiscount) > 0
    ? t("promo:discount.percentageCapped", { value: promo.value, max: formatPrice(promo.maxDiscount, { currency }) })
    : t("promo:discount.percentage", { value: promo.value });
}
