import User from "../models/User.js";
import Addresses from "../models/Addresses.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Notification from "../models/OrderNotification.js";

/**
 * Everything the platform holds about one person, in a portable shape - the
 * right of access and portability. What is left out is left out on purpose:
 * credentials and their hashes, push tokens themselves, idempotency keys, and
 * other people's data (a courier's view of a customer, a seller's customers).
 */

const ORDER_FIELDS = [
  "orderNumber", "status", "currency", "items", "subtotal", "deliveryFee", "serviceFee",
  "priorityFee", "tax", "tip", "discount", "total", "paymentMethod", "paymentStatus",
  "deliveryAddressSnapshot", "customerNotes", "customerRating", "cancellationReason",
  "cancelledBy", "createdAt", "confirmedAt", "deliveredAt", "cancelledAt", "rejectedAt",
].join(" ");

const plainItems = (items = []) =>
  items.map(({ name, price, quantity, specialInstructions }) => ({
    name, price, quantity, ...(specialInstructions ? { specialInstructions } : {}),
  }));

async function customerData(userId) {
  const [addresses, cart, orders] = await Promise.all([
    Addresses.find({ userId }).select("-userId -__v").lean(),
    Cart.findOne({ user: userId }).populate("restaurant", "name").lean(),
    Order.find({ customer: userId })
      .select(ORDER_FIELDS)
      .populate("restaurant", "name")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    addresses,
    cart: cart
      ? { restaurant: cart.restaurant?.name ?? null, items: plainItems(cart.items), updatedAt: cart.updatedAt }
      : null,
    orders: orders.map(({ _id, restaurant, items, ...order }) => ({
      ...order,
      restaurant: restaurant?.name ?? null,
      items: plainItems(items),
    })),
  };
}

async function courierData(userId) {
  const courier = await Courier.findOne({ userId })
    .select("-userId -currentOrder -ratingSum -__v")
    .lean();
  if (!courier) return { courierProfile: null, deliveries: [] };

  const deliveries = await Order.find({ courier: courier._id })
    .select("orderNumber status currency deliveryFee priorityFee tip courierNotes assignedAt pickedUpAt deliveredAt cancelledAt")
    .populate("restaurant", "name")
    .sort({ createdAt: -1 })
    .lean();

  const { _id, ...courierProfile } = courier;
  return {
    courierProfile,
    deliveries: deliveries.map(({ _id: id, restaurant, ...delivery }) => ({
      ...delivery,
      restaurant: restaurant?.name ?? null,
    })),
  };
}

async function sellerData(userId) {
  const restaurant = await Restaurant.findOne({ ownerId: userId })
    .select("-ownerId -ratingSum -isOpenNow -__v")
    .lean();
  if (!restaurant) return { restaurant: null, menu: [] };

  const menu = await MenuItem.find({ restaurant: restaurant._id, deletedAt: null })
    .select("name description price category available promotion imageUrls createdAt")
    .lean();

  const { _id, ...profile } = restaurant;
  return { restaurant: profile, menu: menu.map(({ _id: id, ...item }) => item) };
}

export async function exportAccountData(userId) {
  const user = await User.findById(userId)
    .select("name email phoneNumber role authProvider googleId profilePicture locale favouriteRestaurants createdAt updatedAt +pushTokens")
    .populate("favouriteRestaurants", "name")
    .lean();

  const notifications = await Notification.find({ recipient: userId })
    .select("type title message createdAt isRead")
    .sort({ createdAt: -1 })
    .lean();

  const roleData =
    user.role === "courier"
      ? await courierData(userId)
      : user.role === "seller"
        ? await sellerData(userId)
        : {};
  // A courier or seller can also have ordered food as a customer.
  const asCustomer = await customerData(userId);

  return {
    exportedAt: new Date().toISOString(),
    account: {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      role: user.role,
      signInMethods: [
        ...(user.authProvider === "local" ? ["password"] : []),
        ...(user.googleId ? ["google"] : []),
      ],
      profilePicture: user.profilePicture || null,
      language: user.locale ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    devices: (user.pushTokens ?? []).map(({ platform, lastSeenAt }) => ({ platform, lastSeenAt })),
    favouriteRestaurants: (user.favouriteRestaurants ?? []).map((r) => r?.name).filter(Boolean),
    ...asCustomer,
    ...roleData,
    notifications: notifications.map(({ _id, ...n }) => n),
  };
}
