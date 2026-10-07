// Dish options end to end: what a seller may save, how a basket line is keyed
// and priced, what repricing does when the seller edits an option, and that
// the order keeps a copy of what was chosen.
//
//   node scripts/checkMenuOptions.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 8900 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const EMAIL = `buyer-${Date.now()}@options.test`;

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = repl.getUri();
const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: {
    ...process.env,
    MONGODB_URL: uri,
    PORT: String(PORT),
    JWT_SECRET: randomBytes(48).toString("base64url"),
    NODE_ENV: "development",
    LOG_LEVEL: "silent",
    MAIL_DISABLED: "true",
    REDIS_URL: "",
  },
  stdio: ["ignore", "ignore", "inherit"],
});

let token = null;
async function call(method, p, body) {
  const res = await fetch(BASE + p, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const lines = async () => (await call("GET", "/api/cart")).body?.data?.items ?? [];

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  await mongoose.connect(uri);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Order } = await import("../models/Order.js");
  const menuService = await import("../services/menuItem.service.js");
  await Order.init();

  const reg = await call("POST", "/api/auth/register", {
    email: EMAIL, name: "Buyer", password: "optionspass1", role: "customer", phoneNumber: "0600000000",
  });
  token = reg.body?.token;

  const owner = await User.create({ name: "O", email: `o-${Date.now()}@options.test`, password: "x", role: "seller" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: `r-${Date.now()}@options.test`, phone: "0622222222",
    cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
    isActive: true, isOpenNow: true,
  });
  const base = {
    restaurantId: String(restaurant._id), userId: owner._id, name: "Burger", description: "d",
    price: "900", category: "Burgers", available: "true",
    imageUrls: ["https://res.cloudinary.com/demo/image/upload/b.jpg"],
  };

  console.log("\nwhat a seller can save");
  const refused = async (optionGroups) => {
    try {
      await menuService.createNewMenuItem({ ...base, optionGroups });
      return null;
    } catch (error) {
      return error.code;
    }
  };
  ok("unreadable JSON is refused", (await refused("{nope")) === "OPTION_GROUPS_INVALID");
  ok("a group with no options is refused", (await refused([{ name: "Size", options: [] }])) === "OPTION_GROUPS_INVALID");
  ok("a pick range wider than the options is refused",
    (await refused([{ name: "Size", minSelect: 0, maxSelect: 4, options: [{ name: "a" }] }])) === "OPTION_GROUPS_INVALID");
  ok("a negative extra price is refused",
    (await refused([{ name: "Size", options: [{ name: "a", priceDelta: -5 }] }])) === "OPTION_GROUPS_INVALID");
  ok("nothing was stored by those", (await MenuItem.countDocuments({})) === 0);

  const dish = await menuService.createNewMenuItem({
    ...base,
    optionGroups: JSON.stringify([
      { name: "Size", minSelect: "1", maxSelect: "1", options: [
        { name: "Regular", priceDelta: "0" }, { name: "Large", priceDelta: "200" },
      ] },
      { name: "Extras", minSelect: "0", maxSelect: "2", options: [
        { name: "Cheese", priceDelta: "80" }, { name: "Bacon", priceDelta: "120" },
        { name: "Truffle", priceDelta: "400", available: "false" },
      ] },
    ]),
  });
  ok("a multipart JSON string is stored as groups", dish.optionGroups.length === 2 && dish.optionGroups[1].options.length === 3);
  const [size, extras] = dish.optionGroups;
  const id = (group, name) => String(group.options.find((o) => o.name === name)._id);
  const plain = await MenuItem.create({
    restaurant: restaurant._id, owner: owner._id, name: "Fries", description: "d", price: 300,
    category: "Burgers", available: true, imageUrls: ["https://res.cloudinary.com/demo/image/upload/f.jpg"],
  });

  console.log("\nthe restaurant menu carries them");
  const menu = await call("GET", `/api/restaurants/${restaurant._id}/menu`);
  const listed = JSON.stringify(menu.body).includes('"Extras"');
  ok("the customer menu includes option groups", listed, `status ${menu.status}`);

  console.log("\nadding to the basket");
  let r = await call("POST", "/api/cart/items", { menuItemId: String(dish._id), quantity: 1 });
  ok("a required group cannot be skipped", r.status === 400 && r.body?.code === "OPTION_REQUIRED", `${r.status} ${r.body?.code}`);
  r = await call("POST", "/api/cart/items", {
    menuItemId: String(dish._id), options: [id(size, "Regular"), id(size, "Large")],
  });
  ok("two picks in a pick-one group are refused", r.body?.code === "OPTION_TOO_MANY", r.body?.code);
  r = await call("POST", "/api/cart/items", { menuItemId: String(dish._id), options: [id(size, "Large"), id(extras, "Truffle")] });
  ok("a sold-out option is refused", r.body?.code === "OPTION_UNAVAILABLE", r.body?.code);
  r = await call("POST", "/api/cart/items", { menuItemId: String(dish._id), options: [id(size, "Large"), "000000000000000000000000"] });
  ok("an option from nowhere is refused", r.body?.code === "OPTION_UNKNOWN", r.body?.code);
  r = await call("POST", "/api/cart/items", { menuItemId: String(dish._id), options: "nope" });
  ok("options that are not a list are refused", r.status === 400, String(r.status));
  ok("the basket is still empty", (await lines()).length === 0);

  await call("POST", "/api/cart/items", { menuItemId: String(plain._id) });
  await call("POST", "/api/cart/items", {
    menuItemId: String(dish._id), options: [id(size, "Large"), id(extras, "Cheese")],
  });
  await call("POST", "/api/cart/items", {
    menuItemId: String(dish._id), options: [id(extras, "Cheese"), id(size, "Large")], quantity: 2,
  });
  await call("POST", "/api/cart/items", { menuItemId: String(dish._id), options: [id(size, "Regular")] });
  let items = await lines();
  const large = items.find((l) => l.options?.some((o) => o.name === "Large"));
  const regular = items.find((l) => l.options?.some((o) => o.name === "Regular"));
  const fries = items.find((l) => String(l.menuItem?._id ?? l.menuItem) === String(plain._id) && !l.options?.length);
  ok("three lines: fries, large burger, regular burger", items.length === 3, String(items.length));
  ok("a plain dish keeps its own id as its line id", fries && (fries.lineId ?? String(plain._id)) === String(plain._id), fries?.lineId);
  ok("the same picks in another order join one line", large?.quantity === 3, String(large?.quantity));
  ok("a line is priced dish + options", large?.price === 1180, String(large?.price));
  ok("the chosen options are copied in menu order", large?.options?.map((o) => o.name).join() === "Large,Cheese");
  ok("a free option costs nothing extra", regular?.price === 900, String(regular?.price));

  console.log("\nchanging and removing lines by line id");
  r = await call("PATCH", `/api/cart/items/${encodeURIComponent(regular.lineId)}`, { quantity: 4 });
  items = await lines();
  ok("the regular line went to 4 and the large stayed at 3",
    items.find((l) => l.lineId === regular.lineId)?.quantity === 4 && items.find((l) => l.lineId === large.lineId)?.quantity === 3,
    `${r.status}`);
  r = await call("DELETE", `/api/cart/items/${encodeURIComponent(regular.lineId)}`);
  items = await lines();
  ok("removing it leaves the other burger", items.length === 2 && items.some((l) => l.lineId === large.lineId));

  console.log("\na promotion discounts the dish, not the extras");
  await MenuItem.updateOne({ _id: dish._id }, { $set: { promotion: { isActive: true, type: "percentage", value: 50 } } });
  let cart = await call("GET", "/api/cart");
  items = cart.body?.data?.items ?? [];
  const promoted = items.find((l) => l.lineId === large.lineId);
  ok("price is half the dish plus full options", promoted?.price === 730, String(promoted?.price));
  ok("the struck-through price includes the options", promoted?.basePrice === 1180, String(promoted?.basePrice));
  ok("the change is reported against the line", cart.body?.priceChanges?.some((c) => c.lineId === large.lineId));
  await MenuItem.updateOne({ _id: dish._id }, { $set: { promotion: { isActive: false } } });
  await call("GET", "/api/cart");

  console.log("\nthe seller edits the options");
  const current = await MenuItem.findById(dish._id);
  await menuService.updateMenuItem({
    ...base, menuItemId: String(dish._id), existingImages: current.imageUrls, newFiles: [],
    promotion: undefined,
  });
  ok("an update that sends no options keeps them", (await MenuItem.findById(dish._id)).optionGroups.length === 2);

  const edited = current.toObject().optionGroups;
  edited[1].options[0].priceDelta = 100;
  await menuService.updateMenuItem({
    ...base, menuItemId: String(dish._id), existingImages: current.imageUrls, newFiles: [],
    optionGroups: JSON.stringify(edited),
  });
  const after = await MenuItem.findById(dish._id);
  ok("ids survive an edit, so baskets still match", String(after.optionGroups[1].options[0]._id) === id(extras, "Cheese"));
  cart = await call("GET", "/api/cart");
  ok("a dearer option reprices the line", cart.body?.data?.items?.find((l) => l.lineId === large.lineId)?.price === 1200,
    String(cart.body?.data?.items?.find((l) => l.lineId === large.lineId)?.price));

  console.log("\ncheckout");
  const addr = await call("POST", "/api/delivery-address", {
    address: "Knez Mihailova 10", label: "Home", type: "apartment", location: { lat: 44.81, lng: 20.46 },
  });
  const addressId = addr.body?.address?._id ?? addr.body?.data?.address?._id ?? addr.body?.data?._id;
  const payload = {
    restaurantId: String(restaurant._id), deliveryAddressId: String(addressId),
    paymentMethod: "cash", deliveryType: "standard",
  };

  edited[1].options[0].available = false;
  await menuService.updateMenuItem({
    ...base, menuItemId: String(dish._id), existingImages: current.imageUrls, newFiles: [],
    optionGroups: JSON.stringify(edited),
  });
  r = await call("POST", "/api/orders/create", payload);
  ok("a sold-out option blocks checkout as unavailable", r.body?.code === "ITEM_UNAVAILABLE", `${r.status} ${r.body?.code}`);

  edited[1].options[0].available = true;
  await menuService.updateMenuItem({
    ...base, menuItemId: String(dish._id), existingImages: current.imageUrls, newFiles: [],
    optionGroups: JSON.stringify(edited),
  });
  r = await call("POST", "/api/orders/create", payload);
  ok("the order is placed", r.status < 400, `${r.status} ${r.body?.code}`);
  const order = await Order.findOne({}).lean();
  const burger = order?.items?.find((l) => l.name === "Burger");
  ok("the order line keeps the chosen options", burger?.options?.map((o) => o.name).join() === "Large,Cheese");
  ok("and the full unit price", burger?.price === 1200, String(burger?.price));
  ok("the subtotal counts the options", order?.subtotal === 1200 * 3 + 300, String(order?.subtotal));
  ok("a plain line stores no options", !order?.items?.find((l) => l.name === "Fries")?.options);

  await MenuItem.updateOne({ _id: dish._id }, { $set: { optionGroups: [] } });
  ok("renaming or deleting options later leaves the order as it was",
    (await Order.findById(order._id).lean()).items.find((l) => l.name === "Burger").options.length === 2);
} finally {
  child.kill();
  await mongoose.disconnect();
  await repl.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
