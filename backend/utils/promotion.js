/**
 * Menu item promotions - the single source of truth.
 *
 * A promotion lives on the MenuItem itself: the seller marks a dish down, and
 * every surface that shows a price (discovery feed, restaurant menu, cart,
 * order) has to agree on what that dish now costs. Rather than let each of
 * those recompute it, they all call `effectivePrice` from here.
 *
 * Two shapes only: a percentage off, or a fixed amount off. Anything richer
 * (bundles, buy-one-get-one, restaurant-wide free delivery) needs data the
 * Restaurant and Order models do not carry, so it is deliberately not modelled
 * rather than faked.
 */

import { AppError } from "./AppError.js";

export const PROMOTION_TYPES = ["percentage", "fixed"];

/** A dish may not be discounted to less than this. */
export const MIN_PROMOTIONAL_PRICE = 0.5;

/** Percentage promotions are capped short of free, which is never intended. */
export const MAX_PERCENTAGE_OFF = 90;

/** Longest a seller's promotion label may be. Matches the schema. */
export const MAX_PROMOTION_LABEL = 40;

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Is this promotion in force right now?
 *
 * A promotion with no window runs until the seller turns it off; a window
 * closes it automatically, which is what makes "weekend deal" possible without
 * the seller having to remember to switch it back.
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
 * What a dish actually costs right now.
 *
 * @param {number} price Undiscounted price.
 * @param {Object | null | undefined} promotion
 * @param {Date} [now]
 * @returns {number}
 */
export function effectivePrice(price, promotion, now = new Date()) {
  const base = Number(price) || 0;
  if (!isPromotionLive(promotion, now)) return round2(base);

  const value = Number(promotion.value);
  const discounted =
    promotion.type === "fixed" ? base - value : base * (1 - value / 100);

  return round2(Math.max(MIN_PROMOTIONAL_PRICE, Math.min(base, discounted)));
}

/**
 * Whole-percent saving, for the "-30%" badge. Returns 0 when nothing is off,
 * so a caller can use it as the "should I render a badge" test.
 *
 * @param {number} price
 * @param {Object | null | undefined} promotion
 * @param {Date} [now]
 * @returns {number}
 */
export function discountPercent(price, promotion, now = new Date()) {
  const base = Number(price) || 0;
  if (base <= 0) return 0;
  const next = effectivePrice(base, promotion, now);
  if (next >= base) return 0;
  return Math.round((1 - next / base) * 100);
}

/**
 * Validate and coerce a promotion payload.
 *
 * Menu items are submitted as multipart (they carry images), so every value
 * arrives as a string - `"true"`, `"25"`, `"2026-09-10T18:00"`. This is the one
 * place that turns them back into the types the schema wants, and the one place
 * that rejects a nonsensical deal.
 *
 * @param {Object | null | undefined} raw
 * @param {number} price The item's undiscounted price, needed to check that the
 *   promotion does not price the dish below `MIN_PROMOTIONAL_PRICE`.
 * @returns {{ isActive: boolean, type: string, value: number, label: string, startsAt: Date | null, endsAt: Date | null }}
 * @throws {AppError} 400 on invalid input.
 */
export function normalizePromotionInput(raw, price) {
  const fail = (message) => {
    throw new AppError(message, 400);
  };

  const empty = {
    isActive: false,
    type: "percentage",
    value: 0,
    label: "",
    startsAt: null,
    endsAt: null,
  };

  if (!raw || typeof raw !== "object") return empty;

  const isActive = raw.isActive === true || raw.isActive === "true";
  if (!isActive) return empty;

  const type = String(raw.type || "percentage");
  if (!PROMOTION_TYPES.includes(type)) {
    fail("Promotion type must be either a percentage or a fixed amount");
  }

  const value = Number(raw.value);
  if (!Number.isFinite(value) || value <= 0) {
    fail("Enter how much is off before turning the promotion on");
  }
  if (type === "percentage" && value > MAX_PERCENTAGE_OFF) {
    fail(`A percentage promotion cannot exceed ${MAX_PERCENTAGE_OFF}%`);
  }

  const base = Number(price) || 0;
  const discounted =
    type === "fixed" ? base - value : base * (1 - value / 100);
  if (discounted < MIN_PROMOTIONAL_PRICE) {
    fail(
      `That promotion would drop the price below ${MIN_PROMOTIONAL_PRICE.toFixed(2)}. Lower the discount.`,
    );
  }

  const label = String(raw.label || "")
    .trim()
    .slice(0, MAX_PROMOTION_LABEL);

  const parseDate = (input, field) => {
    if (!input) return null;
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) fail(`${field} is not a valid date`);
    return date;
  };

  const startsAt = parseDate(raw.startsAt, "Promotion start");
  const endsAt = parseDate(raw.endsAt, "Promotion end");

  if (startsAt && endsAt && endsAt <= startsAt) {
    fail("The promotion has to end after it starts");
  }

  return { isActive: true, type, value, label, startsAt, endsAt };
}

/**
 * Attach the resolved price to a lean menu item document.
 *
 * Virtuals do not survive `.lean()`, and every read path in discovery is lean,
 * so this is how a promoted price reaches the client.
 *
 * @template {{ price?: number, promotion?: Object }} T
 * @param {T} item
 * @param {Date} [now]
 * @returns {T & { promotionalPrice: number, discountPercent: number }}
 */
export function withPromotion(item, now = new Date()) {
  if (!item) return item;
  return {
    ...item,
    promotionalPrice: effectivePrice(item.price, item.promotion, now),
    discountPercent: discountPercent(item.price, item.promotion, now),
  };
}
