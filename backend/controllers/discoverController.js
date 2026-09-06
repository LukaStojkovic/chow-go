import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import { withPromotion } from "../utils/promotion.js";
import mongoose from "mongoose";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getNearbyRestaurantIds(
  lat,
  lon,
  maxDistance = 20000,
  { requireOpen = true } = {},
) {
  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
        key: "location",
        distanceField: "distance",
        maxDistance,
        spherical: true,
      },
    },
    {
      $match: requireOpen
        ? { isActive: true, isOpenNow: true }
        : { isActive: true },
    },
    { $project: { _id: 1 } },
  ]);
  return restaurants.map((r) => r._id);
}

/** How recently a restaurant must have joined to count as "new in town". */
const NEW_RESTAURANT_WINDOW_DAYS = 30;

/** The fields a restaurant card needs, wherever it is rendered. */
const RESTAURANT_CARD_FIELDS =
  "name profilePicture images cuisineType address averageRating totalReviews estimatedDeliveryTime isOpenNow isActive createdAt";

export async function getDiscoverFeed(req, res, next) {
  try {
    const { lat, lon, category, page = 1, limit = 10 } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: "Location required" });
    }

    const restaurantIds = await getNearbyRestaurantIds(lat, lon);
    if (!restaurantIds.length) {
      return res.status(200).json({ data: [], hasMore: false });
    }

    let query = { restaurant: { $in: restaurantIds }, available: true };
    if (category && category !== "All") {
      // Categories are free text typed by sellers, so "Pizza", "pizza" and
      // "PIZZA" all have to resolve to the same discovery chip.
      query.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await MenuItem.find(query)
      .populate({
        path: "restaurant",
        select:
          "name profilePicture address averageRating totalReviews estimatedDeliveryTime",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await MenuItem.countDocuments(query);

    const now = new Date();

    res.status(200).json({
      data: items.map((item) => withPromotion(item, now)),
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPopularItems(req, res, next) {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: "Location required" });
    }

    const restaurantIds = await getNearbyRestaurantIds(lat, lon);
    if (!restaurantIds.length) return res.status(200).json({ data: [] });

    const popularItemIds = await Order.aggregate([
      { $match: { restaurant: { $in: restaurantIds } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItem",
          orderCount: { $sum: "$items.quantity" },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 15 },
    ]);

    const itemIds = popularItemIds.map((pi) => pi._id);

    let items = [];
    if (itemIds.length > 0) {
      items = await MenuItem.find({ _id: { $in: itemIds }, available: true })
        .populate({ path: "restaurant", select: "name profilePicture" })
        .lean();
    }

    if (items.length < 5) {
      const existingIds = items.map((i) => i._id);
      const fallbackItems = await MenuItem.find({
        restaurant: { $in: restaurantIds },
        _id: { $nin: existingIds },
        available: true,
      })
        .sort({ createdAt: -1 })
        .limit(10 - items.length)
        .populate({ path: "restaurant", select: "name profilePicture" })
        .lean();

      items = [...items, ...fallbackItems];
    }

    const now = new Date();

    res.status(200).json({ data: items.map((item) => withPromotion(item, now)) });
  } catch (error) {
    next(error);
  }
}

export async function searchDiscover(req, res, next) {
  try {
    const { lat, lon, query } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: "Location required" });
    }
    const term = String(query ?? "")
      .trim()
      .slice(0, 80);
    if (!term) return res.status(200).json({ restaurants: [], items: [] });

    const restaurantIds = await getNearbyRestaurantIds(lat, lon);
    if (!restaurantIds.length) {
      return res.status(200).json({ restaurants: [], items: [] });
    }

    const regex = new RegExp(escapeRegex(term), "i");

    const matchedRestaurants = await Restaurant.find({
      _id: { $in: restaurantIds },
      $or: [{ name: regex }, { cuisineType: regex }, { description: regex }],
      isActive: true,
    })
      .select("name profilePicture averageRating estimatedDeliveryTime cuisineType")
      .limit(5)
      .lean();

    const matchedItems = await MenuItem.find({
      restaurant: { $in: restaurantIds },
      $or: [{ name: regex }, { description: regex }, { category: regex }],
      available: true,
    })
      .populate({ path: "restaurant", select: "name" })
      .limit(10)
      .lean();

    const now = new Date();

    res.status(200).json({
      restaurants: matchedRestaurants,
      items: matchedItems.map((item) => withPromotion(item, now)),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Everything the discovery screen's promotional strip needs, in one request.
 *
 * Both lists are derived from real data:
 *   - "deals" are menu items whose seller has a promotion running right now,
 *     sorted by how deep the discount is.
 *   - "newRestaurants" are restaurants that joined within the last
 *     NEW_RESTAURANT_WINDOW_DAYS days.
 *
 * There is deliberately no "free delivery" list: delivery fees are a flat
 * platform charge with no per-restaurant field behind them, so such a card
 * would be advertising something the checkout could not honour.
 */
export async function getPromotions(req, res, next) {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: "Location required" });
    }

    const restaurantIds = await getNearbyRestaurantIds(lat, lon, 20000, {
      requireOpen: false,
    });
    if (!restaurantIds.length) {
      return res.status(200).json({ deals: [], newRestaurants: [] });
    }

    const now = new Date();
    const newSince = new Date(
      now.getTime() - NEW_RESTAURANT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    // The window clauses treat a missing date as "no bound", which is how an
    // open-ended promotion is stored.
    const [candidates, newRestaurants] = await Promise.all([
      MenuItem.find({
        restaurant: { $in: restaurantIds },
        available: true,
        "promotion.isActive": true,
        $and: [
          {
            $or: [
              { "promotion.startsAt": null },
              { "promotion.startsAt": { $lte: now } },
            ],
          },
          {
            $or: [
              { "promotion.endsAt": null },
              { "promotion.endsAt": { $gt: now } },
            ],
          },
        ],
      })
        .populate({ path: "restaurant", select: RESTAURANT_CARD_FIELDS })
        .limit(60)
        .lean(),

      Restaurant.find({
        _id: { $in: restaurantIds },
        createdAt: { $gte: newSince },
      })
        .select(RESTAURANT_CARD_FIELDS)
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
    ]);

    const deals = candidates
      .map((item) => withPromotion(item, now))
      // isPromotionLive is stricter than the query above (it also rejects a
      // zero value), so anything surviving here is genuinely discounted.
      .filter((item) => item.discountPercent > 0)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 12);

    res.status(200).json({ deals, newRestaurants });
  } catch (error) {
    next(error);
  }
}
