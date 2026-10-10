// Basket suggestions: dishes often ordered with what is in the basket, then a
// drink and a dessert when the basket has neither - and never anything already
// in it, unavailable, or from a restaurant that cannot take the order.
//
//   node scripts/checkUpsell.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 9800 + Math.floor(Math.random() * 150);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.JWT_SECRET = randomBytes(48).toString("base64url");
process.env.LOG_LEVEL = "silent";

const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", MAIL_DISABLED: "true", REDIS_URL: "" },
  stdio: ["ignore", "ignore", "inherit"],
});

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Order } = await import("../models/Order.js");
  const { default: Cart } = await import("../models/Cart.js");
  const { generateToken } = await import("../utils/generateToken.js");

  const owner = await User.create({ name: "O", email: "o@upsell.test", password: "x", role: "seller" });
  const buyer = await User.create({ name: "B", email: "b@upsell.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const token = generateToken(buyer, null, false, { skipCookie: true });
  const sellerToken = generateToken(owner, null, false, { skipCookie: true });

  const makeRestaurant = (tag, extra = {}) =>
    Restaurant.create({
      ownerId: tag === "main" ? owner._id : new mongoose.Types.ObjectId(), name: tag, email: `${tag}@upsell.test`,
      phone: "0622222222", cuisineType: "burgers", description: "t",
      profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true, ...extra,
    });
  const restaurant = await makeRestaurant("main");
  const other = await makeRestaurant("other");

  const dish = (name, category, extra = {}) =>
    MenuItem.create({
      restaurant: restaurant._id, owner: owner._id, name, description: "d", price: 500, category,
      available: true, imageUrls: [`https://res.cloudinary.com/demo/image/upload/${name}.jpg`], ...extra,
    });
  const burger = await dish("Burger", "Burgers");
  const fries = await dish("Fries", "Burgers");
  const salad = await dish("Salad", "Salads");
  const nuggets = await dish("Nuggets", "Burgers");
  const lemonade = await dish("Lemonade", "Drinks");
  const cola = await dish("Cola", "Drinks");
  const cake = await dish("Cake", "Desserts", { promotion: { isActive: true, type: "percentage", value: 20 } });
  const soldOut = await dish("Shake", "Drinks", { available: false });

  let n = 0;
  const order = (items, extra = {}) =>
    Order.create({
      orderNumber: `UP-${++n}`, customer: buyer._id, restaurant: restaurant._id, status: "delivered",
      items: items.map((item) => ({ menuItem: item._id, name: item.name, price: 500, quantity: 1 })),
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: 500 * items.length, deliveryFee: 250, serviceFee: 150, total: 500 * items.length + 400,
      paymentMethod: "cash", ...extra,
    });
  for (let i = 0; i < 3; i++) await order([burger, fries]);
  await order([burger, salad]);
  for (let i = 0; i < 4; i++) await order([cola]);
  await order([lemonade, cake]);
  for (let i = 0; i < 5; i++) await order([burger, nuggets], { status: "cancelled" });
  for (let i = 0; i < 5; i++) await order([burger, soldOut]);
  await Order.create({
    orderNumber: "UP-other", customer: buyer._id, restaurant: other._id, status: "delivered",
    items: [{ menuItem: burger._id, name: "Burger", price: 500, quantity: 1 }, { menuItem: salad._id, name: "Salad", price: 500, quantity: 1 }],
    deliveryAddress: new mongoose.Types.ObjectId(),
    deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
    subtotal: 1000, deliveryFee: 250, serviceFee: 150, total: 1400, paymentMethod: "cash",
  });

  const setCart = (dishes) =>
    Cart.findOneAndUpdate(
      { user: buyer._id },
      { user: buyer._id, restaurant: restaurant._id, items: dishes.map((d) => ({ menuItem: d._id, name: d.name, price: 500, quantity: 1 })) },
      { upsert: true, new: true },
    );
  const suggest = async (auth = token) => {
    const res = await fetch(`${BASE}/api/cart/suggestions`, { headers: { "X-Client": "mobile", Authorization: `Bearer ${auth}` } });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, list: body?.data?.suggestions ?? [] };
  };
  const names = (list) => list.map((s) => `${s.name}:${s.reason}`);

  console.log("\nan empty basket");
  let r = await suggest();
  ok("suggests nothing", r.status === 200 && r.list.length === 0, `${r.status} ${JSON.stringify(r.list).slice(0, 80)}`);

  console.log("\na basket with a burger");
  await setCart([burger]);
  r = await suggest();
  ok("fries come first: ordered with a burger three times", r.list[0]?.name === "Fries" && r.list[0]?.reason === "together", JSON.stringify(names(r.list)));
  ok("a drink follows, the most popular one", names(r.list).includes("Cola:drink") && !names(r.list).includes("Lemonade:drink"),
    JSON.stringify(names(r.list)));
  ok("and a dessert", names(r.list).includes("Cake:dessert"), JSON.stringify(names(r.list)));
  ok("one shared order is not enough to call it ordered together",
    !r.list.some((s) => s.name === "Salad" && s.reason === "together"));
  ok("cancelled orders do not count", !r.list.some((s) => s.name === "Nuggets" && s.reason === "together"));
  ok("remaining places are filled with the menu's best sellers",
    r.list.slice(3).every((s) => s.reason === "popular") && r.list.length === 6, JSON.stringify(names(r.list)));
  ok("an unavailable dish is never offered", !r.list.some((s) => s.name === "Shake"));
  ok("the basket's own dish is not offered", !r.list.some((s) => s.name === "Burger"));
  const offeredCake = r.list.find((s) => s.name === "Cake");
  ok("prices carry the live promotion and the restaurant currency",
    offeredCake?.promotionalPrice === 400 && offeredCake?.currency === "RSD", JSON.stringify(offeredCake ?? {}).slice(0, 160));
  ok("dishes carry their options and id for adding", Array.isArray(offeredCake?.optionGroups) && Boolean(offeredCake?._id));
  ok("at most six suggestions", r.list.length <= 6);

  console.log("\nbaskets that already have a drink or dessert");
  await setCart([burger, lemonade]);
  r = await suggest();
  ok("no drink is pushed when the basket has one", !r.list.some((s) => s.reason === "drink"), JSON.stringify(names(r.list)));
  await setCart([burger, lemonade, cake]);
  r = await suggest();
  ok("nor a dessert when it has one", !r.list.some((s) => s.reason === "dessert"), JSON.stringify(names(r.list)));

  console.log("\na drink already ordered together");
  const upsell = await import("../services/upsell.service.js");
  for (let i = 0; i < 2; i++) await order([burger, lemonade]);
  await setCart([burger]);
  const direct = await upsell.suggestionsForCart(String(buyer._id));
  ok("is offered as ordered together", direct.some((s) => s.name === "Lemonade" && s.reason === "together"), JSON.stringify(names(direct)));
  ok("and no second drink is pushed after it", !direct.some((s) => s.reason === "drink"), JSON.stringify(names(direct)));

  console.log("\na brand-new restaurant with no orders");
  const newcomer = await makeRestaurant("newcomer");
  const newDish = (name, category) =>
    MenuItem.create({
      restaurant: newcomer._id, owner: owner._id, name, description: "d", price: 300, category,
      available: true, imageUrls: [`https://res.cloudinary.com/demo/image/upload/${name}.jpg`],
    });
  const soup = await newDish("Soup", "soup");
  await newDish("Water", "drink");
  await newDish("Pie", "dessert");
  await newDish("Stew", "grill");
  await Cart.findOneAndUpdate(
    { user: buyer._id },
    { restaurant: newcomer._id, items: [{ menuItem: soup._id, name: "Soup", price: 300, quantity: 1 }] },
  );
  const fresh = await upsell.suggestionsForCart(String(buyer._id));
  ok("still offers a drink and a dessert, matching lowercase singular categories",
    JSON.stringify(names(fresh).slice(0, 2)) === JSON.stringify(["Water:drink", "Pie:dessert"]), JSON.stringify(names(fresh)));
  ok("and fills the rest with the menu as popular dishes, so the rail is never empty",
    names(fresh).includes("Stew:popular"), JSON.stringify(names(fresh)));
  await setCart([burger]);

  console.log("\nwhen nothing should be offered");
  const weekly = (entry) =>
    Object.fromEntries(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => [day, entry]));
  await Restaurant.updateOne({ _id: restaurant._id }, {
    $set: { isOpenNow: false, schedule: weekly({ isOpen: true, openingTime: "00:00", closingTime: "00:00" }) },
  });
  await setCart([burger]);
  r = await suggest();
  ok("a closed restaurant taking pre-orders still gets suggestions", r.status === 200 && r.list.length > 0, JSON.stringify(names(r.list)));
  await Restaurant.updateOne({ _id: restaurant._id }, {
    $set: { schedule: weekly({ isOpen: false, openingTime: "09:00", closingTime: "17:00" }) },
  });
  r = await suggest();
  ok("one shut all week gets none", r.status === 200 && r.list.length === 0, JSON.stringify(names(r.list)));
  await Restaurant.updateOne({ _id: restaurant._id }, { $set: { isOpenNow: true } });
  r = await suggest(sellerToken);
  ok("the route is for customers only", r.status === 403, String(r.status));
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
