import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import PromoCode from "../models/PromoCode.js";
import PromoRedemption from "../models/PromoRedemption.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Cart from "../models/Cart.js";
import { repriceCartLines } from "./cartPricing.service.js";
import AuditLog from "../models/AuditLog.js";
import { AppError } from "../utils/AppError.js";
import { parsePagination } from "../utils/pagination.js";
import { containsRegex } from "../utils/regex.js";
import { logger } from "../utils/logger.js";
import { toMoney } from "../utils/money.js";
import { sendPushToUser } from "./push.service.js";
import { tFor } from "@chowgo/shared/i18n";
import { normalizeCurrency } from "@chowgo/shared/currency";
import { pricingFor } from "@chowgo/shared/adapters/pricing";
import {
  PROMO_LIMITS,
  PROMO_TYPES,
  RESTAURANT_PROMO_TYPES,
  computePromoDiscount,
  isValidCode,
  normalizeCode,
} from "@chowgo/shared/promoCode";

const LOCKED_AFTER_USE = ["type", "value", "maxDiscount", "currency"];
const TERMINAL = ["cancelled", "rejected"];

const fail = (key, status, code, params, details) =>
  new AppError(`errors:promoCode.${key}`, status, code, params, details);

const notFound = () => fail("notFound", 404, "PROMO_NOT_FOUND");

const assertId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw notFound();
};

const page = (items, total, { page: pageNum, limit }) => ({
  items,
  pagination: { page: pageNum, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
});

export const fundedByOf = (promo) => (promo.scope === "platform" ? "platform" : "restaurant");

export function publicPromo(promo) {
  return {
    code: promo.code,
    label: promo.label,
    type: promo.type,
    value: promo.value,
    maxDiscount: promo.maxDiscount ?? null,
    minSubtotal: promo.minSubtotal || 0,
    currency: promo.currency,
    endsAt: promo.endsAt ?? null,
    restaurant: promo.restaurant ?? null,
    personal: Boolean(promo.assignedTo),
  };
}

// ------------------------------------------------------------------ checkout

export async function evaluatePromo({ code, customerId, restaurant, subtotal, deliveryFee, now = new Date() }) {
  if (!isValidCode(code)) throw notFound();
  const promo = await PromoCode.findOne({ code: normalizeCode(code) }).lean();

  if (!promo || promo.status === "archived") throw notFound();
  if (promo.assignedTo && String(promo.assignedTo) !== String(customerId)) throw notFound();
  if (promo.status !== "active") throw fail("inactive", 400, "PROMO_INACTIVE");

  if (promo.scope === "restaurant" && String(promo.restaurant) !== String(restaurant._id)) {
    throw fail("wrongRestaurant", 400, "PROMO_WRONG_RESTAURANT");
  }
  if (
    promo.scope === "platform" &&
    promo.restaurants?.length > 0 &&
    !promo.restaurants.some((id) => String(id) === String(restaurant._id))
  ) {
    throw fail("wrongRestaurant", 400, "PROMO_WRONG_RESTAURANT");
  }
  if (normalizeCurrency(promo.currency) !== normalizeCurrency(restaurant.currency)) {
    throw fail("currencyMismatch", 400, "PROMO_CURRENCY_MISMATCH");
  }

  if (promo.startsAt && new Date(promo.startsAt) > now) throw fail("notStarted", 400, "PROMO_NOT_STARTED");
  if (promo.endsAt && new Date(promo.endsAt) <= now) throw fail("expired", 400, "PROMO_EXPIRED");
  if (promo.maxRedemptions && promo.redemptionCount >= promo.maxRedemptions) {
    throw fail("exhausted", 409, "PROMO_EXHAUSTED");
  }

  if (promo.minSubtotal > 0 && subtotal < promo.minSubtotal) {
    throw fail(
      "minSubtotal",
      400,
      "PROMO_MIN_SUBTOTAL",
      { min: `${promo.minSubtotal} ${promo.currency}` },
      { minSubtotal: promo.minSubtotal, currency: promo.currency },
    );
  }

  const used = await PromoRedemption.countDocuments({
    promo: promo._id,
    customer: customerId,
    status: "redeemed",
  });
  if (used >= (promo.perCustomerLimit || 1)) throw fail("alreadyUsed", 409, "PROMO_ALREADY_USED");

  if (promo.firstOrderOnly) {
    const ordered = await Order.exists({ customer: customerId, status: { $nin: TERMINAL } });
    if (ordered) throw fail("firstOrderOnly", 400, "PROMO_FIRST_ORDER_ONLY");
  }

  return { promo, discount: computePromoDiscount({ promo, subtotal, deliveryFee }) };
}

export async function redeemPromo({ promo, customerId, orderId, discount, session }) {
  const claimed = await PromoCode.findOneAndUpdate(
    {
      _id: promo._id,
      status: "active",
      $or: [{ maxRedemptions: null }, { $expr: { $lt: ["$redemptionCount", "$maxRedemptions"] } }],
    },
    { $inc: { redemptionCount: 1 } },
    { session, new: true },
  );
  if (!claimed) throw fail("exhausted", 409, "PROMO_EXHAUSTED");

  const taken = await PromoRedemption.find({ promo: promo._id, customer: customerId, status: "redeemed" })
    .select("slot")
    .session(session)
    .lean();
  const used = new Set(taken.map((r) => r.slot));
  const limit = claimed.perCustomerLimit || 1;
  let slot = 0;
  while (used.has(slot)) slot++;
  if (slot >= limit) throw fail("alreadyUsed", 409, "PROMO_ALREADY_USED");

  try {
    await PromoRedemption.create(
      [{ promo: promo._id, customer: customerId, order: orderId, slot, discount }],
      { session },
    );
  } catch (err) {
    if (err?.code === 11000) throw fail("alreadyUsed", 409, "PROMO_ALREADY_USED");
    throw err;
  }
}

export async function releasePromoForOrder(orderId) {
  try {
    const redemption = await PromoRedemption.findOneAndUpdate(
      { order: orderId, status: "redeemed" },
      { $set: { status: "released", releasedAt: new Date() } },
    ).lean();
    if (!redemption) return false;
    await PromoCode.updateOne(
      { _id: redemption.promo, redemptionCount: { $gt: 0 } },
      { $inc: { redemptionCount: -1 } },
    );
    return true;
  } catch (err) {
    logger.error({ err, orderId: String(orderId) }, "Releasing a promo redemption failed");
    return false;
  }
}

export async function releaseOrphanedRedemptions(now = new Date(), batch = 100) {
  const orders = await Order.find({
    "promo.promoCode": { $exists: true },
    status: { $in: TERMINAL },
    updatedAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
  })
    .select("_id")
    .sort({ updatedAt: -1 })
    .limit(batch * 5)
    .lean();
  if (orders.length === 0) return 0;

  const stuck = await PromoRedemption.find({ order: { $in: orders.map((o) => o._id) }, status: "redeemed" })
    .select("order")
    .limit(batch)
    .lean();
  let released = 0;
  for (const { order } of stuck) {
    if (await releasePromoForOrder(order)) released++;
  }
  return released;
}

export async function validateForCheckout({ customerId, code, restaurantId }) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) throw notFound();
  const restaurant = await Restaurant.findById(restaurantId).select("currency").lean();
  if (!restaurant) throw notFound();
  const cart = await Cart.findOne({ user: customerId, restaurant: restaurantId }).populate("items.menuItem");
  if (cart) repriceCartLines(cart);
  const subtotal = toMoney(cart?.totalPrice ?? 0);
  const { deliveryFee } = pricingFor(restaurant.currency);
  const { promo, discount } = await evaluatePromo({ code, customerId, restaurant, subtotal, deliveryFee });
  return { promo: publicPromo(promo), discount, subtotal };
}

export async function listCustomerVouchers(customerId, now = new Date()) {
  const vouchers = await PromoCode.find({
    assignedTo: customerId,
    status: "active",
    $and: [
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
      { $or: [{ maxRedemptions: null }, { $expr: { $lt: ["$redemptionCount", "$maxRedemptions"] } }] },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return vouchers.map(publicPromo);
}

// ------------------------------------------------------------------ management

function toDate(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail("valueInvalid", 400, "PROMO_INVALID", undefined, { field });
  return date;
}

function toLimit(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw fail("limitInvalid", 400, "PROMO_LIMIT_INVALID");
  return n;
}

function toAmount(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw fail("valueInvalid", 400, "PROMO_INVALID");
  return toMoney(n);
}

function normalizeInput(input, { allowedTypes, partial, currentType }) {
  const out = {};

  if (!partial || input.code !== undefined) {
    if (!isValidCode(input.code)) {
      throw fail("codeInvalid", 400, "PROMO_CODE_INVALID", {
        min: PROMO_LIMITS.minCodeLength,
        max: PROMO_LIMITS.maxCodeLength,
      });
    }
    out.code = normalizeCode(input.code);
  }

  if (input.label !== undefined) {
    const label = typeof input.label === "string" ? input.label.trim() : "";
    if (label.length > PROMO_LIMITS.maxLabelLength) {
      throw fail("labelTooLong", 400, "PROMO_LABEL_TOO_LONG", { max: PROMO_LIMITS.maxLabelLength });
    }
    out.label = label;
  }

  if (!partial || input.type !== undefined) {
    if (!allowedTypes.includes(input.type)) throw fail("typeInvalid", 400, "PROMO_TYPE_INVALID");
    out.type = input.type;
  }

  if (!partial || input.value !== undefined || input.type !== undefined) {
    const type = out.type ?? currentType;
    if (type === "free_delivery") {
      out.value = 0;
    } else if (input.value !== undefined || !partial) {
      const value = Number(input.value);
      if (!Number.isFinite(value) || value <= 0) throw fail("valueInvalid", 400, "PROMO_INVALID");
      if (type === "percentage" && value > PROMO_LIMITS.maxPercentOff) {
        throw fail("maxPercent", 400, "PROMO_INVALID", { max: PROMO_LIMITS.maxPercentOff });
      }
      out.value = type === "percentage" ? Math.round(value) : toMoney(value);
    }
  }

  const maxDiscount = toAmount(input.maxDiscount);
  if (maxDiscount !== undefined) out.maxDiscount = maxDiscount || null;
  const minSubtotal = toAmount(input.minSubtotal);
  if (minSubtotal !== undefined) out.minSubtotal = minSubtotal ?? 0;

  const startsAt = toDate(input.startsAt, "startsAt");
  const endsAt = toDate(input.endsAt, "endsAt");
  if (startsAt !== undefined) out.startsAt = startsAt;
  if (endsAt !== undefined) out.endsAt = endsAt;

  const maxRedemptions = toLimit(input.maxRedemptions);
  if (maxRedemptions !== undefined) out.maxRedemptions = maxRedemptions;
  const perCustomerLimit = toLimit(input.perCustomerLimit);
  if (perCustomerLimit !== undefined) out.perCustomerLimit = perCustomerLimit ?? 1;

  if (input.firstOrderOnly !== undefined) {
    out.firstOrderOnly = input.firstOrderOnly === true || input.firstOrderOnly === "true";
  }

  return out;
}

function assertDates(doc) {
  if (doc.startsAt && doc.endsAt && new Date(doc.endsAt) <= new Date(doc.startsAt)) {
    throw fail("endsBeforeStart", 400, "PROMO_ENDS_BEFORE_START");
  }
}

async function insertPromo(doc) {
  try {
    return (await PromoCode.create(doc)).toObject();
  } catch (err) {
    if (err?.code === 11000) throw fail("codeTaken", 409, "PROMO_CODE_TAKEN");
    throw err;
  }
}

async function assertRestaurantCapacity(restaurantId) {
  const active = await PromoCode.countDocuments({ restaurant: restaurantId, status: "active" });
  if (active >= PROMO_LIMITS.maxActivePerRestaurant) {
    throw fail("tooManyActive", 409, "PROMO_TOO_MANY_ACTIVE", { max: PROMO_LIMITS.maxActivePerRestaurant });
  }
}

async function applyUpdate(existing, changes) {
  if (existing.status === "archived") throw fail("notEditable", 409, "PROMO_NOT_EDITABLE");
  delete changes.code;

  const filter = { _id: existing._id, status: { $ne: "archived" } };
  const touchesLocked = LOCKED_AFTER_USE.some(
    (field) => changes[field] !== undefined && String(changes[field] ?? "") !== String(existing[field] ?? ""),
  );
  if (touchesLocked) {
    if (existing.redemptionCount > 0) throw fail("lockedAfterUse", 409, "PROMO_LOCKED");
    filter.redemptionCount = 0;
  }
  if (changes.maxRedemptions) {
    if (changes.maxRedemptions < existing.redemptionCount) {
      throw fail("limitBelowUsage", 400, "PROMO_LIMIT_BELOW_USAGE", { count: existing.redemptionCount });
    }
    if (!touchesLocked) filter.redemptionCount = { $lte: changes.maxRedemptions };
  }
  assertDates({ ...existing, ...changes });

  const updated = await PromoCode.findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true }).lean();
  if (!updated) throw fail("statusConflict", 409, "STATUS_CONFLICT");
  return updated;
}

const STATUS_RULES = {
  pause: { from: ["active"], to: "paused" },
  resume: { from: ["paused"], to: "active" },
  archive: { from: ["active", "paused"], to: "archived" },
};

async function transitionStatus(filter, action) {
  const rule = STATUS_RULES[action];
  if (!rule) throw new AppError("Unknown action", 400);
  const updated = await PromoCode.findOneAndUpdate(
    { ...filter, status: { $in: rule.from } },
    { $set: { status: rule.to } },
    { new: true },
  ).lean();
  if (!updated) {
    if (!(await PromoCode.exists(filter))) throw notFound();
    throw fail("statusConflict", 409, "STATUS_CONFLICT");
  }
  return updated;
}

export async function promoStats(promoId) {
  const [row] = await Order.aggregate([
    { $match: { "promo.promoCode": new mongoose.Types.ObjectId(promoId) } },
    {
      $group: {
        _id: null,
        orders: { $sum: { $cond: [{ $in: ["$status", TERMINAL] }, 0, 1] } },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        discountGiven: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, { $ifNull: ["$discount", 0] }, 0] },
        },
        revenue: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, { $ifNull: ["$subtotal", 0] }, 0] },
        },
      },
    },
  ]);
  return {
    orders: row?.orders ?? 0,
    delivered: row?.delivered ?? 0,
    discountGiven: toMoney(row?.discountGiven ?? 0),
    revenue: toMoney(row?.revenue ?? 0),
  };
}

// ---------------------------------------------------------------------- seller

async function sellerRestaurant(userId) {
  const restaurant = await Restaurant.findOne({ ownerId: userId }).select("_id currency").lean();
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  return restaurant;
}

async function sellerPromo(userId, promoId) {
  assertId(promoId);
  const restaurant = await sellerRestaurant(userId);
  const promo = await PromoCode.findOne({ _id: promoId, scope: "restaurant", restaurant: restaurant._id }).lean();
  if (!promo) throw notFound();
  return { restaurant, promo };
}

export async function listSellerPromos(userId, query) {
  const restaurant = await sellerRestaurant(userId);
  const paging = parsePagination(query);
  const filter = { scope: "restaurant", restaurant: restaurant._id };
  filter.status = ["active", "paused", "archived"].includes(query.status)
    ? query.status
    : { $ne: "archived" };

  const [items, total] = await Promise.all([
    PromoCode.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    PromoCode.countDocuments(filter),
  ]);
  return page(items, total, paging);
}

export async function createSellerPromo(userId, input) {
  const restaurant = await sellerRestaurant(userId);
  const doc = normalizeInput(input ?? {}, { allowedTypes: RESTAURANT_PROMO_TYPES, partial: false });
  assertDates(doc);
  await assertRestaurantCapacity(restaurant._id);
  return insertPromo({
    ...doc,
    scope: "restaurant",
    restaurant: restaurant._id,
    currency: normalizeCurrency(restaurant.currency),
    createdBy: userId,
  });
}

export async function updateSellerPromo(userId, promoId, input) {
  const { promo } = await sellerPromo(userId, promoId);
  const changes = normalizeInput(input ?? {}, {
    allowedTypes: RESTAURANT_PROMO_TYPES,
    partial: true,
    currentType: promo.type,
  });
  delete changes.currency;
  return applyUpdate(promo, changes);
}

export async function setSellerPromoStatus(userId, promoId, action) {
  const { restaurant, promo } = await sellerPromo(userId, promoId);
  if (action === "resume") await assertRestaurantCapacity(restaurant._id);
  return transitionStatus({ _id: promo._id }, action);
}

export async function sellerPromoStats(userId, promoId) {
  const { promo } = await sellerPromo(userId, promoId);
  return { promo, stats: await promoStats(promo._id) };
}

// ----------------------------------------------------------------------- admin

async function audit(actor, { action, targetId, reason = "", before, after, requestId }) {
  await AuditLog.create({
    actor: actor._id,
    actorEmail: actor.email,
    action,
    targetType: "promo",
    targetId,
    reason,
    before,
    after,
    requestId,
  });
}

const cleanReason = (reason) => (typeof reason === "string" ? reason.trim().slice(0, 500) : "");

function requireReason(reason) {
  const text = cleanReason(reason);
  if (!text) throw new AppError("A reason is required", 400, "REASON_REQUIRED");
  return text;
}

const snapshot = (promo) => ({
  code: promo.code,
  status: promo.status,
  type: promo.type,
  value: promo.value,
  maxRedemptions: promo.maxRedemptions ?? null,
  endsAt: promo.endsAt ?? null,
});

async function resolveRestaurantIds(ids) {
  if (ids === undefined) return undefined;
  const list = Array.isArray(ids) ? ids : [];
  if (list.length === 0) return [];
  if (!list.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    throw fail("restaurantInvalid", 400, "PROMO_RESTAURANT_INVALID");
  }
  const found = await Restaurant.countDocuments({ _id: { $in: list } });
  if (found !== new Set(list.map(String)).size) throw fail("restaurantInvalid", 400, "PROMO_RESTAURANT_INVALID");
  return [...new Set(list.map(String))];
}

export async function listAdminPromos(query) {
  const paging = parsePagination(query);
  const filter = {};
  if (["platform", "restaurant"].includes(query.scope)) filter.scope = query.scope;
  if (["active", "paused", "archived"].includes(query.status)) filter.status = query.status;
  if (query.personal === "true") filter.assignedTo = { $ne: null };
  if (query.personal === "false") filter.assignedTo = null;
  const search = containsRegex(query.q);
  if (search) filter.$or = [{ code: search }, { label: search }];

  const [items, total] = await Promise.all([
    PromoCode.find(filter)
      .populate("restaurant", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .lean(),
    PromoCode.countDocuments(filter),
  ]);
  return page(items, total, paging);
}

export async function createAdminPromo({ actor, input = {}, requestId }) {
  const doc = normalizeInput(input, { allowedTypes: PROMO_TYPES, partial: false });
  assertDates(doc);
  const restaurants = await resolveRestaurantIds(input.restaurants);
  const created = await insertPromo({
    ...doc,
    scope: "platform",
    restaurants: restaurants ?? [],
    currency: normalizeCurrency(input.currency),
    createdBy: actor._id,
  });
  await audit(actor, { action: "promo.create", targetId: created._id, after: snapshot(created), requestId });
  return created;
}

export async function updateAdminPromo({ actor, promoId, input = {}, requestId }) {
  assertId(promoId);
  const promo = await PromoCode.findById(promoId).lean();
  if (!promo) throw notFound();
  const allowedTypes = promo.scope === "platform" ? PROMO_TYPES : RESTAURANT_PROMO_TYPES;
  const changes = normalizeInput(input, { allowedTypes, partial: true, currentType: promo.type });
  if (promo.scope === "platform") {
    const restaurants = await resolveRestaurantIds(input.restaurants);
    if (restaurants !== undefined) changes.restaurants = restaurants;
    if (input.currency !== undefined) changes.currency = normalizeCurrency(input.currency);
  }
  const updated = await applyUpdate(promo, changes);
  await audit(actor, {
    action: "promo.update",
    targetId: promo._id,
    reason: cleanReason(input.reason),
    before: snapshot(promo),
    after: snapshot(updated),
    requestId,
  });
  return updated;
}

export async function setAdminPromoStatus({ actor, promoId, action, reason, requestId }) {
  assertId(promoId);
  const before = await PromoCode.findById(promoId).lean();
  if (!before) throw notFound();
  const note = before.scope === "restaurant" && action !== "resume" ? requireReason(reason) : cleanReason(reason);
  const updated = await transitionStatus({ _id: before._id }, action);
  await audit(actor, {
    action: `promo.${action}`,
    targetId: before._id,
    reason: note,
    before: snapshot(before),
    after: snapshot(updated),
    requestId,
  });
  return updated;
}

export async function adminPromoStats(promoId) {
  assertId(promoId);
  const promo = await PromoCode.findById(promoId).lean();
  if (!promo) throw notFound();
  return { promo, stats: await promoStats(promo._id) };
}

function voucherCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `GIFT-${out}`;
}

export async function issueVoucher({ actor, orderId, input = {}, requestId }) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new AppError("errors:order.notFound", 404);
  const reason = requireReason(input.reason);
  const order = await Order.findById(orderId).select("customer restaurant currency orderNumber").lean();
  if (!order) throw new AppError("errors:order.notFound", 404);

  const type = input.type ?? "fixed";
  const doc = normalizeInput(
    { ...input, code: "GIFT-PLACEHOLDER", type, perCustomerLimit: 1, maxRedemptions: 1 },
    { allowedTypes: PROMO_TYPES, partial: false },
  );
  assertDates(doc);
  const days = Number(input.validDays);
  const endsAt =
    doc.endsAt ?? new Date(Date.now() + (Number.isInteger(days) && days > 0 ? Math.min(days, 365) : 90) * 86_400_000);

  let created;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      created = await insertPromo({
        ...doc,
        code: voucherCode(),
        label: doc.label || `Order ${order.orderNumber}`,
        endsAt,
        scope: "platform",
        restaurants: [],
        currency: normalizeCurrency(order.currency),
        assignedTo: order.customer,
        sourceOrder: order._id,
        createdBy: actor._id,
      });
    } catch (err) {
      if (err?.code !== "PROMO_CODE_TAKEN") throw err;
    }
  }
  if (!created) throw new AppError("Could not generate a unique code", 500);

  await audit(actor, {
    action: "promo.issueVoucher",
    targetId: created._id,
    reason,
    after: { ...snapshot(created), order: String(order._id), customer: String(order.customer) },
    requestId,
  });

  const amount =
    created.type === "percentage"
      ? `${created.value}%`
      : created.type === "fixed"
        ? `${created.value} ${created.currency}`
        : null;
  sendPushToUser(order.customer, (locale) => ({
    title: tFor(locale, "promo:push.voucherTitle"),
    body: amount
      ? tFor(locale, "promo:push.voucherBody", { amount, code: created.code })
      : tFor(locale, "promo:push.voucherBodyFreeDelivery", { code: created.code }),
    data: { type: "voucher", code: created.code },
  }));

  return created;
}
