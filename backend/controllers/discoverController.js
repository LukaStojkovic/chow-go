import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

async function getNearbyRestaurantIds(lat, lon, maxDistance = 20000) {
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
    { $match: { isActive: true } },
    { $project: { _id: 1 } },
  ]);
  return restaurants.map((r) => r._id);
}

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
      query.category = category;
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

    res.status(200).json({
      data: items,
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

    res.status(200).json({ data: items });
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
    if (!query) return res.status(200).json({ restaurants: [], items: [] });

    const restaurantIds = await getNearbyRestaurantIds(lat, lon);
    if (!restaurantIds.length) {
      return res.status(200).json({ restaurants: [], items: [] });
    }

    const regex = new RegExp(query, "i");

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

    res.status(200).json({
      restaurants: matchedRestaurants,
      items: matchedItems,
    });
  } catch (error) {
    next(error);
  }
}
