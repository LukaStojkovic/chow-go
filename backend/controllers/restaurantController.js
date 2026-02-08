import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import { AppError } from "../utils/AppError.js";
import cloudinary from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../utils/formatData.js";
import mongoose from "mongoose";

export async function createMenuItem(req, res, next) {
  const { restaurantId } = req.params;
  const { name, description, price, category, available } = req.body;

  if (!name || !price || !category) {
    return next(new AppError("Name, price, and category are required", 400));
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return next(new AppError("Price must be a positive number", 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return next(
      new AppError("Not authorized to add items to this restaurant", 403),
    );
  }

  const imageUrls = req.files?.map((file) => file.path) || [];

  const newMenuItem = await MenuItem.create({
    name: name.trim(),
    description: description?.trim() || "",
    price: numericPrice,
    category: category.trim(),
    available: available !== "false",
    imageUrls,
    restaurant: restaurantId,
    owner: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      menuItem: newMenuItem,
    },
  });
}

export async function getRestaurantMenuByCategories(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  const menuByCategories = await MenuItem.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        available: true,
      },
    },
    {
      $group: {
        _id: "$category",
        items: {
          $push: {
            _id: "$_id",
            name: "$name",
            description: "$description",
            price: "$price",
            available: "$available",
            imageUrls: "$imageUrls",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const menu = menuByCategories.map((group) => ({
    category: group._id || "Uncategorized",
    items: group.items,
  }));

  res.status(200).json({
    status: "success",
    menu,
  });
}

export async function getRestaurantMenuItems(req, res, next) {
  const { restaurantId } = req.params;

  let {
    page = 1,
    limit = 12,
    search = "",
    category = "",
    minPrice = "",
    maxPrice = "",
    available = "",
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return next(new AppError("Restaurant not found", 404));

  let query = { restaurant: restaurantId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (available !== "") {
    query.available = available === "true";
  }

  const menuItems = await MenuItem.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalItems = await MenuItem.countDocuments(query);

  res.status(200).json({
    status: "success",
    data: {
      menuItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        limit,
        hasNext: page < Math.ceil(totalItems / limit),
        hasPrev: page > 1,
      },
    },
  });
}

export async function deleteMenuItem(req, res, next) {
  const { restaurantId, menuItemId } = req.params;

  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
  });

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to delete this menu item", 403));
  }

  for (const url of menuItem.imageUrls) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(console.error);
    }
  }

  await MenuItem.deleteOne({ _id: menuItemId });

  res.status(200).json({
    status: "success",
    message: "Menu item deleted successfully",
  });
}

export async function getRestaurantInformations(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId).lean();

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: restaurant,
  });
}

export async function editMenuItem(req, res, next) {
  const { restaurantId, menuItemId } = req.params;
  const { name, description, price, category, available, existingImages } =
    req.body;

  if (!name || !price || !category) {
    return next(new AppError("Name, price, and category are required", 400));
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return next(new AppError("Price must be a positive number", 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return next(
      new AppError("Not authorized to edit items in this restaurant", 403),
    );
  }

  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
  });

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  let imageUrls = [...menuItem.imageUrls];

  if (existingImages !== undefined) {
    let incoming = [];

    if (Array.isArray(existingImages)) {
      incoming = existingImages.filter(
        (url) => typeof url === "string" && url.includes("res.cloudinary.com"),
      );
    } else if (
      typeof existingImages === "string" &&
      existingImages.includes("res.cloudinary.com")
    ) {
      incoming = [existingImages];
    }

    imageUrls = incoming;
  }

  if (req.files && req.files.length > 0) {
    const newFileUrls = req.files.map((file) => file.path);
    imageUrls.push(...newFileUrls);
  }

  if (imageUrls.length === 0) {
    return next(new AppError("At least one image is required", 400));
  }

  const imagesToRemove = menuItem.imageUrls.filter(
    (url) => !imageUrls.includes(url),
  );
  for (const url of imagesToRemove) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch((err) => {
        console.error("Failed to delete image from Cloudinary:", publicId, err);
      });
    }
  }

  const hasImageChanges =
    imageUrls.length !== menuItem.imageUrls.length ||
    !imageUrls.every((url, i) => url === menuItem.imageUrls[i]);

  if (hasImageChanges) {
    menuItem.imageUrls = imageUrls;
  }

  menuItem.name = name.trim();
  menuItem.description = description?.trim() || "";
  menuItem.price = numericPrice;
  menuItem.category = category.trim();
  menuItem.available = available !== "false";

  await menuItem.save();

  res.status(200).json({
    status: "success",
    data: {
      menuItem,
    },
  });
}

export async function updateRestaurant(req, res, next) {
  const userId = req.user._id;
  const {
    name,
    description,
    phone,
    email,
    openingTime,
    closingTime,
    estimatedDeliveryTime,
    address,
  } = req.body;

  const restaurant = await Restaurant.findOne({ ownerId: userId });

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  if (req.file) {
    if (restaurant.profilePicture) {
      const publicId = extractCloudinaryPublicId(restaurant.profilePicture);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(console.error);
      }
    }

    restaurant.profilePicture = req.file.path;
  }

  if (name !== undefined && name.trim()) {
    restaurant.name = name.trim();
  }

  if (description !== undefined) {
    restaurant.description = description.trim();
  }

  if (phone !== undefined) {
    restaurant.phone = phone.trim();
  }

  if (email !== undefined && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError("Invalid email format", 400));
    }
    restaurant.email = email.trim();
  }

  if (openingTime !== undefined) {
    restaurant.openingTime = openingTime;
  }

  if (closingTime !== undefined) {
    restaurant.closingTime = closingTime;
  }

  if (estimatedDeliveryTime !== undefined) {
    restaurant.estimatedDeliveryTime = estimatedDeliveryTime.trim();
  }

  if (address) {
    if (!restaurant.address) {
      restaurant.address = {};
    }

    if (address.street !== undefined) {
      restaurant.address.street = address.street.trim();
    }
    if (address.city !== undefined) {
      restaurant.address.city = address.city.trim();
    }
    if (address.state !== undefined) {
      restaurant.address.state = address.state.trim();
    }
    if (address.zipCode !== undefined) {
      restaurant.address.zipCode = address.zipCode.trim();
    }
    if (address.country !== undefined) {
      restaurant.address.country = address.country.trim();
    }
  }

  await restaurant.save();

  const updatedUser = await req.user.populate({
    path: "restaurant",
    select: "-__v",
  });

  res.status(200).json({
    status: "success",
    message: "Restaurant updated successfully",
    user: updatedUser,
  });
}

export async function getRestaurantStats(req, res, next) {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return next(new AppError("Invalid restaurant ID", 400));
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Unauthorized to access this restaurant's stats", 403),
      );
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - 14);

    const startOfLastMonth = new Date(now);
    startOfLastMonth.setDate(now.getDate() - 60);

    const [
      weekOrders,
      monthOrders,
      lastWeekOrders,
      lastMonthOrders,

      activeOrders,

      popularItems,

      dailyRevenue,

      uniqueCustomers,
      lastMonthUniqueCustomers,

      recentOrders,
    ] = await Promise.all([
      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfWeek },
        status: { $nin: ["cancelled", "rejected"] },
      }),

      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      }),

      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfLastWeek, $lt: startOfWeek },
        status: { $nin: ["cancelled", "rejected"] },
      }),

      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      }),

      Order.countDocuments({
        restaurant: restaurantId,
        status: {
          $in: [
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "assigned",
            "picked_up",
            "in_transit",
          ],
        },
      }),

      Order.aggregate([
        {
          $match: {
            restaurant: new mongoose.Types.ObjectId(restaurantId),
            createdAt: { $gte: startOfMonth },
            status: { $nin: ["cancelled", "rejected"] },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.menuItem",
            name: { $first: "$items.name" },
            totalOrders: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            price: { $first: "$items.price" },
          },
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 4 },
      ]),

      Order.aggregate([
        {
          $match: {
            restaurant: new mongoose.Types.ObjectId(restaurantId),
            createdAt: { $gte: startOfWeek },
            status: { $nin: ["cancelled", "rejected"] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.distinct("customer", {
        restaurant: restaurantId,
        createdAt: { $gte: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      }),

      Order.distinct("customer", {
        restaurant: restaurantId,
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      }),

      Order.find({
        restaurant: restaurantId,
        status: {
          $in: ["pending", "confirmed", "preparing", "ready"],
        },
      })
        .populate("customer", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = monthOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    const lastWeekActiveOrders = lastWeekOrders.filter((order) =>
      [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "assigned",
        "picked_up",
        "in_transit",
      ].includes(order.status),
    ).length;

    const revenueTrend =
      lastMonthRevenue > 0
        ? (
            ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : totalRevenue > 0
          ? 100
          : 0;

    const ordersTrend =
      lastWeekActiveOrders > 0
        ? (
            ((activeOrders - lastWeekActiveOrders) / lastWeekActiveOrders) *
            100
          ).toFixed(1)
        : activeOrders > 0
          ? 100
          : 0;

    const customersTrend =
      lastMonthUniqueCustomers.length > 0
        ? (
            ((uniqueCustomers.length - lastMonthUniqueCustomers.length) /
              lastMonthUniqueCustomers.length) *
            100
          ).toFixed(1)
        : uniqueCustomers.length > 0
          ? 100
          : 0;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last7Days.push(dateStr);
    }

    const revenueByDay = last7Days.map((date) => {
      const dayData = dailyRevenue.find((d) => d._id === date);
      return {
        date,
        revenue: dayData ? dayData.revenue : 0,
        orders: dayData ? dayData.orders : 0,
      };
    });

    const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1);
    const chartData = revenueByDay.map((d) => ({
      ...d,
      percentage: (d.revenue / maxRevenue) * 100,
    }));

    const popularItemsWithImages = await Promise.all(
      popularItems.map(async (item) => {
        const menuItem = await MenuItem.findById(item._id);
        return {
          name: item.name,
          totalOrders: item.totalOrders,
          totalRevenue: item.totalRevenue,
          price: item.price,
          image:
            menuItem?.imageUrls?.[0] ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80",
        };
      }),
    );

    res.json({
      success: true,
      stats: {
        totalRevenue: {
          value: totalRevenue.toFixed(2),
          trend: revenueTrend,
          isPositive: parseFloat(revenueTrend) >= 0,
        },
        activeOrders: {
          value: activeOrders,
          trend: ordersTrend,
          isPositive: parseFloat(ordersTrend) >= 0,
        },
        totalCustomers: {
          value: uniqueCustomers.length,
          trend: customersTrend,
          isPositive: parseFloat(customersTrend) >= 0,
        },
        avgRating: {
          value: restaurant.averageRating?.toFixed(1) || "0.0",
          trend: "0",
          isPositive: true,
          totalReviews: restaurant.totalReviews || 0,
        },
      },
      chartData,
      popularItems: popularItemsWithImages,
      recentOrders: recentOrders.map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching restaurant stats:", error);
    next(new AppError("Failed to fetch restaurant stats", 500));
  }
}
