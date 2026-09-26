/**
 * Order pricing.
 *
 * These figures mirror `backend/controllers/orderController.js#createOrder`
 * exactly. The backend is authoritative - the customer is charged whatever it
 * computes - so this module exists so the basket, checkout and confirmation
 * screens all show the same numbers rather than each re-deriving them.
 *
 * If the backend ever makes these per-restaurant, this file becomes a mapper
 * over the server response and nothing else has to change.
 */

import { DEFAULT_CURRENCY, normalizeCurrency } from "../currency.js";
import { sumMoney, toMoney } from "../money.js";

/** @typedef {import("./types").PriceBreakdownView} PriceBreakdownView */

/**
 * Platform fees, per currency - an order is charged in its restaurant's
 * currency, and "2.50" means something very different in dinars. The backend
 * reads these same objects, so the preview and the charge cannot drift.
 */
const FEES = {
  RSD: {
    deliveryFee: 250,
    serviceFee: 150,
    priorityFee: 200,
    tipPresets: [0, 100, 200, 300],
    maxTip: 5000,
  },
  EUR: {
    deliveryFee: 2.5,
    serviceFee: 1.5,
    priorityFee: 1.99,
    tipPresets: [0, 1, 2, 3],
    maxTip: 50,
  },
  USD: {
    deliveryFee: 2.5,
    serviceFee: 1.5,
    priorityFee: 1.99,
    tipPresets: [0, 1, 2, 3],
    maxTip: 50,
  },
};

/**
 * @param {string | null | undefined} currency
 * @returns {{ currency: string, deliveryFee: number, serviceFee: number, priorityFee: number,
 *   taxRate: number, tipPresets: number[], maxTip: number, minimumOrder: number | null }}
 */
export function pricingFor(currency) {
  const code = normalizeCurrency(currency);
  return {
    currency: code,
    ...FEES[code],
    /** The backend sets tax to 0; shown only when it is non-zero. */
    taxRate: 0,
    /**
     * No minimum order is enforced anywhere in the backend, so the UI must not
     * claim one exists.
     */
    minimumOrder: null,
  };
}

/** The default currency's fees, for code with no restaurant in hand. */
export const PRICING = pricingFor(DEFAULT_CURRENCY);

// Re-exported so existing `adapters/pricing` imports keep resolving.
export { toMoney };

/**
 * Build the full price breakdown for a basket.
 *
 * @param {Object} input
 * @param {number} input.subtotal
 * @param {"standard" | "priority"} [input.deliveryType]
 * @param {number} [input.tip]
 * @param {number} [input.discount]
 * @param {string} [input.currency] The restaurant's; picks the fee table.
 * @returns {PriceBreakdownView}
 */
export function buildPriceBreakdown({
  subtotal,
  deliveryType = "standard",
  tip = 0,
  discount = 0,
  currency,
}) {
  const pricing = pricingFor(currency);
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const safeTip = Number.isFinite(tip) ? Math.max(0, tip) : 0;
  const safeDiscount = Number.isFinite(discount) ? Math.max(0, discount) : 0;

  const deliveryFee = pricing.deliveryFee;
  const serviceFee = pricing.serviceFee;
  const priorityFee = deliveryType === "priority" ? pricing.priorityFee : 0;
  const tax = toMoney(safeSubtotal * pricing.taxRate);

  const total = Math.max(
    0,
    sumMoney(safeSubtotal, deliveryFee, serviceFee, priorityFee, tax, safeTip, -safeDiscount),
  );

  return {
    currency: pricing.currency,
    subtotal: toMoney(safeSubtotal),
    deliveryFee,
    serviceFee,
    priorityFee,
    tip: toMoney(safeTip),
    discount: toMoney(safeDiscount),
    tax,
    total,
  };
}

/**
 * Read a breakdown back off a placed order.
 *
 * `serviceFee` and `priorityFee` are stored on the order now, so this is a
 * straight read. Orders placed before that have neither: the schema dropped
 * `serviceFee`, and `priorityFee` was folded into `deliveryFee`. For those,
 * recover the missing amount as the difference and label it honestly rather
 * than print a total that does not add up.
 *
 * @param {Object} order Raw order document.
 * @returns {PriceBreakdownView}
 */
export function breakdownFromOrder(order) {
  if (!order) return buildPriceBreakdown({ subtotal: 0 });

  const subtotal = Number(order.subtotal) || 0;
  const deliveryFee = Number(order.deliveryFee) || 0;
  const tax = Number(order.tax) || 0;
  const tip = Number(order.tip) || 0;
  const discount = Number(order.discount) || 0;
  const total = Number(order.total) || 0;

  // priorityFee is the marker: it only exists on orders written after the fees
  // were persisted separately.
  const isItemised = order.priorityFee !== undefined && order.priorityFee !== null;

  if (isItemised) {
    return {
      currency: normalizeCurrency(order.currency),
      subtotal: toMoney(subtotal),
      deliveryFee: toMoney(deliveryFee),
      serviceFee: toMoney(Number(order.serviceFee) || 0),
      priorityFee: toMoney(Number(order.priorityFee) || 0),
      tip: toMoney(tip),
      discount: toMoney(discount),
      tax: toMoney(tax),
      total: toMoney(total),
    };
  }

  const accountedFor = sumMoney(subtotal, deliveryFee, tax, tip, -discount);
  const unaccounted = Math.max(0, sumMoney(total, -accountedFor));

  return {
    currency: normalizeCurrency(order.currency),
    subtotal: toMoney(subtotal),
    deliveryFee: toMoney(deliveryFee),
    serviceFee: unaccounted,
    priorityFee: 0,
    tip: toMoney(tip),
    discount: toMoney(discount),
    tax: toMoney(tax),
    total: toMoney(total),
  };
}
