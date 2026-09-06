/**
 * Client-side mirror of `backend/utils/promotion.js`.
 *
 * Customer-facing prices are never computed here - the server resolves them and
 * sends `promotionalPrice`, and `lib/adapters/menu.js` reads that. This module
 * exists for the two places that have no server-resolved price to read:
 *
 *   1. The seller's menu management screens, which list raw MenuItem documents.
 *   2. The live preview inside the promotion form, which has to answer "what
 *      will this cost?" before anything is saved.
 *
 * The limits below are duplicated from the backend deliberately, so the form
 * can reject a bad deal without a round trip. The backend re-validates every
 * one of them; this is a convenience, not the enforcement point.
 */

/** Must stay in sync with `backend/utils/promotion.js`. */
export const PROMOTION_LIMITS = {
  maxPercentOff: 90,
  minPrice: 0.5,
  maxLabelLength: 40,
};

export const PROMOTION_TYPES = [
  {
    value: "percentage",
    label: "Percentage off",
    hint: "A share of the price, e.g. 25% off",
  },
  {
    value: "fixed",
    label: "Fixed amount off",
    hint: "A flat reduction, e.g. 2.00 off",
  },
];

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Is this promotion in force right now?
 *
 * @param {Object | null | undefined} promotion
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isPromotionLive(promotion, now = new Date()) {
  if (!promotion || promotion.isActive !== true) return false;
  if (!(Number(promotion.value) > 0)) return false;
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return false;
  if (promotion.endsAt && new Date(promotion.endsAt) <= now) return false;
  return true;
}

/**
 * Resolve a raw MenuItem document's price.
 *
 * @param {number} price
 * @param {Object | null | undefined} promotion
 * @param {Date} [now]
 * @returns {{ price: number, basePrice: number | null, discountPercent: number }}
 */
export function resolvePromotion(price, promotion, now = new Date()) {
  const base = Number(price) || 0;

  if (!isPromotionLive(promotion, now) || base <= 0) {
    return { price: round2(base), basePrice: null, discountPercent: 0 };
  }

  const value = Number(promotion.value);
  const raw = promotion.type === "fixed" ? base - value : base * (1 - value / 100);
  const next = round2(Math.max(PROMOTION_LIMITS.minPrice, Math.min(base, raw)));

  if (next >= base) {
    return { price: round2(base), basePrice: null, discountPercent: 0 };
  }

  return {
    price: next,
    basePrice: round2(base),
    discountPercent: Math.round((1 - next / base) * 100),
  };
}

/**
 * What a promotion being typed into the form would do, for the live preview.
 *
 * Returns `isValid: false` rather than throwing, because half-typed input is
 * the normal state of a form field, not an error worth shouting about.
 *
 * @param {number} price The dish's undiscounted price.
 * @param {{ type?: string, value?: string | number }} draft
 * @returns {{ isValid: boolean, discounted: number, percentOff: number, saving: number }}
 */
export function previewPromotion(price, draft) {
  const base = Number(price);
  const value = Number(draft?.value);
  const invalid = { isValid: false, discounted: 0, percentOff: 0, saving: 0 };

  if (!Number.isFinite(base) || base <= 0) return invalid;
  if (!Number.isFinite(value) || value <= 0) return invalid;
  if (draft?.type === "percentage" && value > PROMOTION_LIMITS.maxPercentOff) {
    return invalid;
  }

  const raw = draft?.type === "fixed" ? base - value : base * (1 - value / 100);
  if (raw < PROMOTION_LIMITS.minPrice) return invalid;

  const discounted = round2(raw);

  return {
    isValid: true,
    discounted,
    percentOff: Math.round((1 - discounted / base) * 100),
    saving: round2(base - discounted),
  };
}
