/**
 * Notification copy, persisted and pushed.
 *
 * Copy is rendered in the *recipient's* locale, not the requesting user's: the
 * seller confirming an order and the customer being told about it are usually
 * two different people reading two different languages. `localeFor` therefore
 * resolves from the recipient document, and every caller that has one passes
 * it in - a caller that does not falls back to the platform default rather
 * than to whoever happens to be making the HTTP request.
 */

import { tFor } from "@chowgo/shared/i18n";

import Notification from "../models/OrderNotification.js";
import { localeForUser } from "../middlewares/locale.js";

/**
 * Priority and the catalog keys for each notification type. The `title` and
 * `body` keys live under `notification` in the `order` namespace, so the same
 * catalog backs the push, the stored row and the in-app copy.
 */
const NOTIFICATION_TEMPLATES = {
  // Seller- and courier-facing. Everything below this pair is written to the
  // customer; these two exist because sendPushToUser was only ever called for
  // the customer, so a backgrounded seller learned nothing about a new order
  // and the pool was socket-only.
  order_placed: { type: "order_placed", priority: "high" },
  order_available: { type: "order_available", priority: "high" },
  order_confirmed: { type: "order_confirmed", priority: "high" },
  order_rejected: { type: "order_rejected", priority: "high" },
  order_preparing: { type: "order_preparing", priority: "medium" },
  order_ready: { type: "order_ready", priority: "high" },
  order_cancelled: { type: "order_cancelled", priority: "high" },

  // courierOrder.service.js has always passed these four to
  // createOrderStatusNotification, which returned null on a missing template -
  // so the entire courier half of the lifecycle silently persisted nothing.
  order_assigned: { type: "order_assigned", priority: "medium" },
  order_picked_up: { type: "order_picked_up", priority: "medium" },
  order_in_transit: { type: "order_in_transit", priority: "high" },
  order_delivered: { type: "order_delivered", priority: "high" },
};

/**
 * Render one notification's title and body.
 *
 * @param {string} type
 * @param {Object | null | undefined} order
 * @param {string} [locale]
 * @returns {{ title: string, body: string } | null}
 */
function render(type, order, locale) {
  if (!NOTIFICATION_TEMPLATES[type]) return null;

  const params = { number: order?.orderNumber ?? "" };
  return {
    title: tFor(locale, `order:notification.${type}.title`, params),
    body: tFor(locale, `order:notification.${type}.body`, params),
  };
}

/**
 * The locale to write a notification in.
 *
 * `order.customer` is an id on a lean order and a populated document on a
 * re-fetched one, so this tolerates both rather than making every caller
 * remember which it has.
 *
 * @param {unknown} recipient
 * @returns {string}
 */
function localeFor(recipient) {
  return localeForUser(
    recipient && typeof recipient === "object" ? recipient : null,
  );
}

/**
 * Push copy comes from the same templates as the stored row, so the two never
 * drift apart.
 *
 * @param {string} type
 * @param {Object} order
 * @param {string} [locale] The recipient's language.
 * @returns {{ title: string, body: string, data: Object } | null}
 */
export function pushPayloadFor(type, order, locale) {
  const copy = render(type, order, locale);
  if (!copy) return null;

  return {
    ...copy,
    data: { type, orderId: String(order?._id ?? "") },
  };
}

/**
 * @param {Object} order
 * @param {string} type
 * @param {{ reason?: string, recipient?: Object }} [options]
 */
function persist(order, type, { reason, recipient } = {}) {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) return null;

  const locale = localeFor(recipient ?? order?.customer);
  const copy = render(type, order, locale);

  return Notification.create({
    recipient: recipient?._id ?? order.customer,
    recipientRole: "customer",
    type: template.type,
    order: order._id,
    title: copy.title,
    message: copy.body,
    priority: template.priority,
    ...(reason === undefined ? {} : { data: { reason } }),
  });
}

export async function createOrderConfirmedNotification(order) {
  return persist(order, "order_confirmed");
}

export async function createOrderRejectedNotification(order, reason) {
  const locale = localeFor(order?.customer);
  return persist(order, "order_rejected", {
    reason: reason || tFor(locale, "order:notification.rejectedFallbackReason"),
  });
}

export async function createOrderStatusNotification(order, newStatus) {
  return persist(order, `order_${newStatus}`);
}

export async function createOrderCancelledNotification(order, reason) {
  const locale = localeFor(order?.customer);
  return persist(order, "order_cancelled", {
    reason: reason || tFor(locale, "order:notification.cancelledFallbackReason"),
  });
}
