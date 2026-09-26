// Every list endpoint clamps page and limit. MongoDB reads limit(0) as "no
// limit" and a negative skip as an error, so ?limit=0 dumped whole collections
// (the discover feed needs no account) and ?page=0 was a 500.
//
//   node scripts/checkPagination.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const HOSTILE = [
  ["limit=0", { limit: "0" }],
  ["limit=-5, page=0", { limit: "-5", page: "0" }],
  ["limit=abc, page=x", { limit: "abc", page: "x" }],
  ["limit=100000", { limit: "100000" }],
  ["an array limit", { limit: ["5", "6"] }],
];
const ROWS = 60;

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Order } = await import("../models/Order.js");
  const { default: Courier } = await import("../models/Courier.js");
  await Promise.all([Restaurant.init(), Order.init()]);
  const { parsePagination } = await import("../utils/pagination.js");
  const { getDiscoverFeed } = await import("../controllers/discoverController.js");
  const { getCustomerOrders } = await import("../controllers/orderController.js");
  const { getAllMenuItems } = await import("../services/menuItem.service.js");
  const { getOrdersByRestaurant } = await import("../services/restaurantOrder.service.js");
  const { listCourierOrders } = await import("../services/courierOrder.service.js");

  console.log("\nthe helper");
  ok("defaults to page 1 of 20", JSON.stringify(parsePagination({})) === JSON.stringify({ page: 1, limit: 20, skip: 0 }));
  ok("page 3 of 10 skips 20", parsePagination({ page: "3", limit: "10" }).skip === 20);
  ok("caps at 50", parsePagination({ limit: "999" }).limit === 50);

  const owner = await User.create({ name: "O", email: "o@page.test", password: "x", role: "seller" });
  const customer = await User.create({ name: "C", email: "c@page.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const courierUser = await User.create({ name: "K", email: "k@page.test", password: "x", role: "courier", phoneNumber: "0611111111" });
  const courier = await Courier.create({ userId: courierUser._id, fullName: "K", phoneNumber: "0611111111", email: "k@page.test", vehicleType: "bike" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@page.test", phone: "0622222222", cuisineType: "pizza",
    description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true,
  });
  await MenuItem.insertMany(
    Array.from({ length: ROWS }, (_, i) => ({
      restaurant: restaurant._id, owner: owner._id, name: `Dish ${i}`, description: "d", price: 9,
      category: "pizza", available: true, imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
    })),
  );
  await Order.insertMany(
    Array.from({ length: ROWS }, (_, i) => ({
      orderNumber: `ORD-PAGE-${i}`, customer: customer._id, restaurant: restaurant._id, courier: courier._id,
      status: "delivered", items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 9, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: 9, deliveryFee: 2.5, tax: 0, total: 11.5, paymentMethod: "cash",
    })),
  );

  const viaHandler = (handler, query, user) =>
    new Promise((resolve) => {
      handler(
        { query, user },
        { status: () => ({ json: (payload) => resolve({ payload }) }) },
        (error) => resolve({ error }),
      );
    });

  const endpoints = [
    ["discover feed (public)", async (q) => {
      const r = await viaHandler(getDiscoverFeed, { lat: "44.8", lon: "20.45", ...q });
      if (r.error) throw r.error;
      return r.payload.data.length;
    }],
    ["customer orders", async (q) => {
      const r = await viaHandler(getCustomerOrders, q, { _id: customer._id });
      if (r.error) throw r.error;
      return r.payload.data.orders.length;
    }],
    ["seller menu", async (q) => (await getAllMenuItems({ restaurantId: restaurant._id, ...q })).menuItems.length],
    ["seller orders", async (q) => (await getOrdersByRestaurant({ restaurantId: restaurant._id, ...q })).orders.length],
    ["courier history", async (q) => (await listCourierOrders({ courierId: courier._id, ...q })).orders.length],
  ];

  for (const [name, fetchRows] of endpoints) {
    console.log(`\n${name}`);
    for (const [label, query] of HOSTILE) {
      let count = null;
      let error = null;
      try {
        count = await fetchRows(query);
      } catch (err) {
        error = err;
      }
      ok(`${label}: between 1 and 50 rows, no error`, !error && count >= 1 && count <= 50, error?.message ?? String(count));
    }
  }
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
