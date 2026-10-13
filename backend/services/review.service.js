import mongoose from "mongoose";
import { REVIEW_LIMITS, reviewerDisplayName } from "@chowgo/shared/reviews";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import { tFor } from "@chowgo/shared/i18n";
import { parsePagination } from "../utils/pagination.js";
import { sendPushToUser } from "./push.service.js";

const RATED = { "customerRating.restaurantRating": { $exists: true, $ne: null } };
const TOP_TAGS = 5;

function filterFor(restaurantId, { rating, withText, unreplied } = {}) {
  const filter = { restaurant: new mongoose.Types.ObjectId(String(restaurantId)), ...RATED };
  const stars = Number(rating);
  if (Number.isInteger(stars) && stars >= 1 && stars <= 5) filter["customerRating.restaurantRating"] = stars;
  if (withText === true || withText === "true") filter["customerRating.restaurantReview"] = { $nin: [null, ""] };
  if (unreplied === true || unreplied === "true") filter["customerRating.restaurantReply.text"] = { $in: [null, ""] };
  return filter;
}

function toReview(order, { forSeller = false } = {}) {
  const rating = order.customerRating ?? {};
  return {
    id: String(order._id),
    rating: rating.restaurantRating,
    text: rating.restaurantReview || null,
    tags: rating.restaurantTags ?? [],
    ratedAt: rating.ratedAt ?? null,
    author: reviewerDisplayName(order.customer?.name),
    reply: rating.restaurantReply?.text
      ? { text: rating.restaurantReply.text, repliedAt: rating.restaurantReply.repliedAt, editedAt: rating.restaurantReply.editedAt ?? null }
      : null,
    ...(forSeller ? { orderNumber: order.orderNumber } : {}),
  };
}

/** Star counts and the most common tags across every rated order. */
async function summaryFor(restaurant) {
  const match = filterFor(restaurant._id);
  const [stars, tags] = await Promise.all([
    Order.aggregate([{ $match: match }, { $group: { _id: "$customerRating.restaurantRating", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: match },
      { $unwind: "$customerRating.restaurantTags" },
      { $group: { _id: "$customerRating.restaurantTags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_TAGS },
    ]),
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const { _id, count } of stars) if (distribution[_id] !== undefined) distribution[_id] = count;
  return {
    average: restaurant.averageRating ?? 0,
    count: restaurant.totalReviews ?? Object.values(distribution).reduce((a, b) => a + b, 0),
    distribution,
    topTags: tags.map(({ _id, count }) => ({ tag: _id, count })),
  };
}

async function page(restaurant, query, options) {
  const { page: current, limit, skip } = parsePagination(query, { defaultLimit: 10 });
  const filter = filterFor(restaurant._id, query);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ "customerRating.ratedAt": -1 })
      .skip(skip)
      .limit(limit)
      .select("customerRating orderNumber customer")
      .populate("customer", "name")
      .lean(),
    Order.countDocuments(filter),
  ]);
  return {
    reviews: orders.map((order) => toReview(order, options)),
    pagination: { page: current, limit, total, hasNext: skip + orders.length < total },
    ...(current === 1 ? { summary: await summaryFor(restaurant) } : {}),
  };
}

/** Public: a restaurant's reviews, newest first, with the summary on page 1. */
export async function listRestaurantReviews(restaurantId, query = {}) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) throw new AppError("errors:restaurant.notFound", 404);
  const restaurant = await Restaurant.findById(restaurantId).select("averageRating totalReviews").lean();
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  return page(restaurant, query, {});
}

async function sellerRestaurant(userId) {
  const restaurant = await Restaurant.findOne({ ownerId: userId }).select("averageRating totalReviews name").lean();
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  return restaurant;
}

/** The seller's own reviews, with order numbers and an "unanswered" filter. */
export async function listOwnReviews(userId, query = {}) {
  return page(await sellerRestaurant(userId), query, { forSeller: true });
}

/** Write or edit the restaurant's public answer to one review. */
export async function replyToReview(userId, orderId, rawText) {
  const restaurant = await sellerRestaurant(userId);
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new AppError("errors:review.notFound", 404, "REVIEW_NOT_FOUND");
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (!text || text.length > REVIEW_LIMITS.replyLength) {
    throw new AppError("errors:review.replyLength", 400, "REVIEW_REPLY_INVALID", { max: REVIEW_LIMITS.replyLength });
  }

  const order = await Order.findOne({ _id: orderId, restaurant: restaurant._id, ...RATED })
    .select("customer customerRating.restaurantReply")
    .lean();
  if (!order) throw new AppError("errors:review.notFound", 404, "REVIEW_NOT_FOUND");

  const now = new Date();
  const isFirst = !order.customerRating?.restaurantReply?.text;
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, restaurant: restaurant._id, ...RATED },
    {
      $set: isFirst
        ? { "customerRating.restaurantReply": { text, repliedAt: now } }
        : { "customerRating.restaurantReply.text": text, "customerRating.restaurantReply.editedAt": now },
    },
    { new: true },
  )
    .select("customerRating orderNumber customer")
    .populate("customer", "name")
    .lean();

  if (isFirst && order.customer) {
    sendPushToUser(order.customer, (locale) => ({
      title: tFor(locale, "restaurant:reviews.push.replyTitle", { restaurant: restaurant.name }),
      body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
      data: { type: "review_reply", orderId: String(orderId) },
    })).catch(() => {});
  }

  return toReview(updated, { forSeller: true });
}

/** Take the restaurant's answer down. */
export async function deleteReply(userId, orderId) {
  const restaurant = await sellerRestaurant(userId);
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new AppError("errors:review.notFound", 404, "REVIEW_NOT_FOUND");
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, restaurant: restaurant._id, ...RATED },
    { $unset: { "customerRating.restaurantReply": "" } },
    { new: true },
  )
    .select("customerRating orderNumber customer")
    .populate("customer", "name")
    .lean();
  if (!updated) throw new AppError("errors:review.notFound", 404, "REVIEW_NOT_FOUND");
  return toReview(updated, { forSeller: true });
}
