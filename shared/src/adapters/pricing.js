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

/** @typedef {import("./types").PriceBreakdownView} PriceBreakdownView */

export const PRICING = {
  /** Flat platform delivery fee. Not stored per restaurant. */
  deliveryFee: 2.5,
  /** Flat platform service fee. */
  serviceFee: 1.5,
  /** Surcharge for the "priority" delivery option. */
  priorityFee: 1.99,
  /** The backend sets tax to 0; shown only when it is non-zero. */
  taxRate: 0,
  /** Suggested tip amounts offered at checkout. */
  tipPresets: [0, 1, 2, 3],
  /**
   * No minimum order is enforced anywhere in the backend, so the UI must not
   * claim one exists. Kept explicit so the intent is not mistaken for an
   * oversight.
   */
  minimumOrder: null,
};

/**
 * Round to cents, avoiding the float drift that makes a total render as
 * 24.299999999999997.
 *
 * @param {number} value
 * @returns {number}
 */
export function toMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Build the full price breakdown for a basket.
 *
 * @param {Object} input
 * @param {number} input.subtotal
 * @param {"standard" | "priority"} [input.deliveryType]
 * @param {number} [input.tip]
 * @param {number} [input.discount]
 * @returns {PriceBreakdownView}
 */
export function buildPriceBreakdown({
  subtotal,
  deliveryType = "standard",
  tip = 0,
  discount = 0,
}) {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const safeTip = Number.isFinite(tip) ? Math.max(0, tip) : 0;
  const safeDiscount = Number.isFinite(discount) ? Math.max(0, discount) : 0;

  const deliveryFee = PRICING.deliveryFee;
  const serviceFee = PRICING.serviceFee;
  const priorityFee = deliveryType === "priority" ? PRICING.priorityFee : 0;
  const tax = toMoney(safeSubtotal * PRICING.taxRate);

  const total = toMoney(
    Math.max(
      0,
      safeSubtotal +
        deliveryFee +
        serviceFee +
        priorityFee +
        tax +
        safeTip -
        safeDiscount,
    ),
  );

  return {
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

  const accountedFor = subtotal + deliveryFee + tax + tip - discount;
  const unaccounted = toMoney(Math.max(0, total - accountedFor));

  return {
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
