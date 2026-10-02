import mongoose from "mongoose";
import User from "../models/User.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import { AppError } from "../utils/AppError.js";
import { parsePagination } from "../utils/pagination.js";
import { containsRegex } from "../utils/regex.js";
import { ACTIVE_STATUSES } from "../utils/orderStatus.js";
import { isOpenAt } from "../utils/schedule.js";
import { disconnectUserSockets } from "../socket/socketServer.js";
import { forceCancelOrder } from "./orderRecovery.service.js";

/**
 * Everything an admin can change goes through here, and every change is a
 * conditional update from the states it is legal from - two admins acting on
 * the same record get one success and one 409, never a silent overwrite - and
 * writes an AuditLog row naming who, what, why, and the before and after.
 */

const assertId = (id, what) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`${what} not found`, 404);
};

const cleanReason = (reason) => (typeof reason === "string" ? reason.trim().slice(0, 500) : "");

function requireReason(reason) {
  const text = cleanReason(reason);
  if (!text) throw new AppError("A reason is required", 400, "REASON_REQUIRED");
  return text;
}

async function audit(actor, { action, targetType, targetId, reason = "", before, after, requestId }) {
  await AuditLog.create({
    actor: actor._id,
    actorEmail: actor.email,
    action,
    targetType,
    targetId,
    reason,
    before,
    after,
    requestId,
  });
}

const page = (items, total, { page: pageNum, limit }) => ({
  items,
  pagination: { page: pageNum, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
});

export async function getOverview() {
  const [pendingRestaurants, pendingCouriers, suspendedUsers, activeOrders] = await Promise.all([
    Restaurant.countDocuments({ approvalStatus: "pending" }),
    Courier.countDocuments({ verificationStatus: "pending" }),
    User.countDocuments({ suspendedAt: { $ne: null } }),
    Order.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
  ]);
  return { pendingRestaurants, pendingCouriers, suspendedUsers, activeOrders };
}

// ---------------------------------------------------------------- restaurants

const RESTAURANT_STATUSES = ["pending", "approved", "rejected", "suspended"];

export async function listRestaurants(query) {
  const paging = parsePagination(query);
  const filter = {};
  if (RESTAURANT_STATUSES.includes(query.status)) {
    // Restaurants from before approval existed have no status and are live.
    filter.approvalStatus =
      query.status === "approved" ? { $in: ["approved", null] } : query.status;
  }
  const search = containsRegex(query.q);
  if (search) filter.$or = [{ name: search }, { email: search }];

  const [items, total] = await Promise.all([
    Restaurant.find(filter)
      .select("name email phone cuisineType address.city profilePicture isActive approvalStatus approvalNote currency createdAt ownerId")
      .populate("ownerId", "name email suspendedAt")
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .lean(),
    Restaurant.countDocuments(filter),
  ]);
  return page(items, total, paging);
}

const RESTAURANT_ACTIONS = {
  approve: { from: ["pending", "rejected"], to: "approved", live: true },
  reject: { from: ["pending"], to: "rejected", live: false, needsReason: true },
  suspend: { from: ["approved", null], to: "suspended", live: false, needsReason: true },
  reinstate: { from: ["suspended"], to: "approved", live: true },
};

export async function setRestaurantStatus({ actor, restaurantId, action, reason, requestId }) {
  const rule = RESTAURANT_ACTIONS[action];
  if (!rule) throw new AppError("Unknown action", 400);
  assertId(restaurantId, "Restaurant");
  const note = rule.needsReason ? requireReason(reason) : cleanReason(reason);

  const current = await Restaurant.findById(restaurantId).lean();
  if (!current) throw new AppError("Restaurant not found", 404);

  const updated = await Restaurant.findOneAndUpdate(
    { _id: restaurantId, approvalStatus: { $in: rule.from } },
    {
      $set: {
        approvalStatus: rule.to,
        approvalNote: note,
        isActive: rule.live,
        isOpenNow: rule.live ? isOpenAt(current.schedule, new Date(), current.timezone) : false,
      },
    },
    { new: true },
  ).lean();
  if (!updated) {
    throw new AppError(
      `This restaurant is ${current.approvalStatus ?? "approved"}, so it cannot be ${action}d`,
      409,
      "STATUS_CONFLICT",
    );
  }

  await audit(actor, {
    action: `restaurant.${action}`,
    targetType: "restaurant",
    targetId: updated._id,
    reason: note,
    before: { approvalStatus: current.approvalStatus ?? "approved", isActive: current.isActive },
    after: { approvalStatus: updated.approvalStatus, isActive: updated.isActive },
    requestId,
  });
  return updated;
}

// ------------------------------------------------------------------- couriers

const COURIER_STATUSES = ["pending", "verified", "rejected"];

export async function listCouriers(query) {
  const paging = parsePagination(query);
  const filter = {};
  if (COURIER_STATUSES.includes(query.status)) filter.verificationStatus = query.status;
  const search = containsRegex(query.q);
  if (search) filter.$or = [{ fullName: search }, { email: search }, { phoneNumber: search }];

  const [items, total] = await Promise.all([
    Courier.find(filter)
      .select("fullName email phoneNumber vehicleType vehicleNumber vehicleModel documents verificationStatus totalDeliveries averageRating createdAt userId")
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .lean(),
    Courier.countDocuments(filter),
  ]);
  return page(items, total, paging);
}

export async function setCourierVerification({ actor, courierId, status, reason, requestId }) {
  if (!COURIER_STATUSES.includes(status)) throw new AppError("Unknown status", 400);
  assertId(courierId, "Courier");
  const note = status === "rejected" ? requireReason(reason) : cleanReason(reason);

  const before = await Courier.findOneAndUpdate(
    { _id: courierId, verificationStatus: { $ne: status } },
    { $set: { verificationStatus: status } },
  ).lean();
  if (!before) {
    const exists = await Courier.exists({ _id: courierId });
    throw new AppError(exists ? `This courier is already ${status}` : "Courier not found", exists ? 409 : 404);
  }

  await audit(actor, {
    action: `courier.${status}`,
    targetType: "courier",
    targetId: before._id,
    reason: note,
    before: { verificationStatus: before.verificationStatus },
    after: { verificationStatus: status },
    requestId,
  });
  return { ...before, verificationStatus: status };
}

// ---------------------------------------------------------------------- users

export async function listUsers(query) {
  const paging = parsePagination(query);
  const filter = { isDeleted: { $ne: true } };
  if (["customer", "seller", "courier"].includes(query.role)) filter.role = query.role;
  if (query.suspended === "true") filter.suspendedAt = { $ne: null };
  const search = containsRegex(query.q);
  if (search) filter.$or = [{ name: search }, { email: search }, { phoneNumber: search }];

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("name email phoneNumber role isAdmin suspendedAt suspensionReason createdAt")
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return page(items, total, paging);
}

export async function suspendUser({ actor, userId, reason, requestId }) {
  assertId(userId, "User");
  const note = requireReason(reason);
  if (String(userId) === String(actor._id)) {
    throw new AppError("You cannot suspend your own account", 400, "SELF_ACTION");
  }

  // Admins are never suspended here: removing one is a deliberate act with
  // scripts/grantAdmin.js --revoke, not something a second admin can do.
  const user = await User.findOneAndUpdate(
    { _id: userId, suspendedAt: null, isAdmin: { $ne: true }, isDeleted: { $ne: true } },
    { $set: { suspendedAt: new Date(), suspensionReason: note }, $inc: { tokenVersion: 1 } },
    { new: true },
  ).lean();
  if (!user) {
    const existing = await User.findById(userId).select("suspendedAt isAdmin").lean();
    if (!existing) throw new AppError("User not found", 404);
    throw new AppError(
      existing.isAdmin ? "Admins cannot be suspended here" : "This account is already suspended",
      409,
      "STATUS_CONFLICT",
    );
  }
  disconnectUserSockets(user._id);

  // A suspended seller cannot answer orders, so the restaurant would sit in
  // discovery collecting ones that time out; a suspended courier cannot be
  // offered any. Reinstating the user does not bring either back on its own.
  const sideEffects = {};
  if (user.role === "seller") {
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: user._id, isActive: true },
      { $set: { isActive: false, isOpenNow: false, approvalStatus: "suspended", approvalNote: note } },
    ).lean();
    if (restaurant) sideEffects.restaurantSuspended = String(restaurant._id);
  }
  if (user.role === "courier") {
    await Courier.updateOne({ userId: user._id }, { $set: { isAvailable: false } });
  }

  await audit(actor, {
    action: "user.suspend",
    targetType: "user",
    targetId: user._id,
    reason: note,
    before: { suspended: false },
    after: { suspended: true, ...sideEffects },
    requestId,
  });
  return user;
}

export async function unsuspendUser({ actor, userId, reason, requestId }) {
  assertId(userId, "User");
  const user = await User.findOneAndUpdate(
    { _id: userId, suspendedAt: { $ne: null } },
    { $unset: { suspendedAt: 1, suspensionReason: 1 } },
    { new: true },
  ).lean();
  if (!user) {
    const exists = await User.exists({ _id: userId });
    throw new AppError(exists ? "This account is not suspended" : "User not found", exists ? 409 : 404);
  }

  await audit(actor, {
    action: "user.unsuspend",
    targetType: "user",
    targetId: user._id,
    reason: cleanReason(reason),
    before: { suspended: true },
    after: { suspended: false },
    requestId,
  });
  return user;
}

// --------------------------------------------------------------------- orders

export async function cancelOrder({ actor, orderId, reason, requestId }) {
  assertId(orderId, "Order");
  const note = requireReason(reason);
  const before = await Order.findById(orderId).select("status").lean();
  const order = await forceCancelOrder(orderId, note);

  await audit(actor, {
    action: "order.cancel",
    targetType: "order",
    targetId: order._id,
    reason: note,
    before: { status: before?.status },
    after: { status: order.status },
    requestId,
  });
  return order;
}

// ---------------------------------------------------------------------- audit

export async function listAudit(query) {
  const paging = parsePagination(query);
  const filter = {};
  if (["restaurant", "courier", "user", "order", "promo"].includes(query.targetType)) {
    filter.targetType = query.targetType;
  }
  if (query.targetId && mongoose.Types.ObjectId.isValid(query.targetId)) {
    filter.targetId = query.targetId;
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return page(items, total, paging);
}
