// Search text reaches MongoDB as a literal, never as a pattern: raw input in
// $regex let "(a+)+$" pin the database's CPU and made "." match everything.
// Runs the seller menu and order searches against a throwaway database.
//
//   node scripts/checkSearchInput.js
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

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Order } = await import("../models/Order.js");
  const { containsRegex } = await import("../utils/regex.js");
  const { getAllMenuItems } = await import("../services/menuItem.service.js");
  const { getOrdersByRestaurant } = await import("../services/restaurantOrder.service.js");

  console.log("\nthe helper");
  ok("metacharacters are literal", containsRegex("a.b").test("a.b") && !containsRegex("a.b").test("axb"));
  ok("a catastrophic pattern is just text", containsRegex("(a+)+$").source === "\\(a\\+\\)\\+\\$");
  ok("an array is ignored", containsRegex(["pizza"]) === null);
  ok("an object is ignored", containsRegex({ $gt: "" }) === null);
  ok("blank is ignored", containsRegex("   ") === null);
  ok("long input is cut to 64 characters", containsRegex("x".repeat(500)).source.length === 64);

  const owner = await User.create({ name: "O", email: "o@search.test", password: "x", role: "seller" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@search.test", phone: "0622222222", cuisineType: "pizza",
    description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });
  await MenuItem.insertMany(
    ["Pizza Margherita", "Pasta (spicy)", "Salad"].map((name) => ({
      restaurant: restaurant._id, owner: owner._id, name, description: "d", price: 9,
      category: name.split(" ")[0], available: true,
      imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
    })),
  );
  await Order.insertMany(
    ["ORD-111-AAAA", "ORD-222-BBBB"].map((orderNumber) => ({
      orderNumber, customer: new mongoose.Types.ObjectId(), restaurant: restaurant._id, status: "pending",
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 9, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: 9, deliveryFee: 2.5, tax: 0, total: 11.5, paymentMethod: "cash",
    })),
  );

  const menu = async (filters) =>
    (await getAllMenuItems({ restaurantId: restaurant._id, ...filters })).menuItems.map((m) => m.name);
  const orders = async (search) =>
    (await getOrdersByRestaurant({ restaurantId: restaurant._id, search })).orders.map((o) => o.orderNumber);

  console.log("\nseller menu search");
  ok("a plain word still matches", (await menu({ search: "pizza" })).join() === "Pizza Margherita");
  ok('"." matches nothing, not everything', (await menu({ search: "." })).length === 0);
  ok('"(spicy)" matches the literal parentheses', (await menu({ search: "(spicy)" })).join() === "Pasta (spicy)");
  const started = Date.now();
  await menu({ search: "(a+)+$" });
  ok("a catastrophic pattern returns at once", Date.now() - started < 1000, `${Date.now() - started}ms`);
  ok("an array search is ignored, not a 500", (await menu({ search: ["x", "y"] })).length === 3);
  ok("an array category is ignored", (await menu({ category: ["Pizza", "Salad"] })).length === 3);

  console.log("\nseller order search");
  ok("a fragment of an order number matches", (await orders("222")).join() === "ORD-222-BBBB");
  ok('".*" matches nothing', (await orders(".*")).length === 0);
  ok("an array is ignored", (await orders(["111"])).length === 2);
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
