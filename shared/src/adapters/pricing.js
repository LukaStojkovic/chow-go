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
 * `serviceFee` is passed to the Order constructor by the backend but is not on
 * the schema, so Mongoose drops it - the stored line items genuinely do not
 * reconcile with `total`. Rather than print a total that does not add up, we
 * recover the missing amount as the difference and label it honestly.
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

  const accountedFor = subtotal + deliveryFee + tax + tip - discount;
  // Whatever the stored total contains beyond the stored line items is the
  // service fee (and priority surcharge, if any) the schema never persisted.
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
