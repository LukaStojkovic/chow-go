// Order creation: that the four writes are one transaction, and that a repeated
// Idempotency-Key returns the original order instead of placing a second one.
//
// Transactions need a replica set, so this starts a single-node one. The same
// requirement already applies to the delivery-address endpoints, which have
// used transactions since before this change.
//
//   node scripts/checkCheckout.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes, randomUUID } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 8600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const EMAIL = `buyer-${Date.now()}@checkout.test`;
const PASSWORD = "checkoutpass1";

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
  },
  stdio: ["ignore", "ignore", "inherit"],
});

let token = null;
async function call(method, p, body, headers = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  await mongoose.connect(uri);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Cart } = await import("../models/Cart.js");
  const { default: Order } = await import("../models/Order.js");
  const { default: Notification } = await import("../models/OrderNotification.js");
  await Order.init();

  const reg = await call("POST", "/api/auth/register", {
    email: EMAIL, name: "Buyer", password: PASSWORD, role: "customer", phoneNumber: "0600000000",
  });
  token = reg.body?.token;
  ok("registered and got a token", Boolean(token), JSON.stringify(reg.body).slice(0, 100));

  const owner = await User.create({ name: "O", email: `o-${Date.now()}@checkout.test`, password: "x", role: "seller" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: `r-${Date.now()}@checkout.test`, phone: "0622222222",
    cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
    isActive: true, isOpenNow: true,
  });
  const item = await MenuItem.create({
    restaurant: restaurant._id, owner: owner._id, name: "Pizza", description: "d", price: 9.5,
    category: "pizza", available: true,
    imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
  });

  const addr = await call("POST", "/api/delivery-address", {
    address: "Knez Mihailova 10", label: "Home", type: "apartment",
    location: { lat: 44.81, lng: 20.46 }, doorCode: "1234#",
  });
  const addressId = addr.body?.address?._id ?? addr.body?.data?.address?._id ?? addr.body?.data?._id;
  ok("saved a delivery address", Boolean(addressId), JSON.stringify(addr.body).slice(0, 140));

  async function stockCart() {
    await call("POST", "/api/cart/items", {
      restaurantId: String(restaurant._id), menuItemId: String(item._id), quantity: 2,
    });
  }

  console.log("\nthe same key never places two orders");
  await stockCart();
  const key = randomUUID();
  const payload = {
    restaurantId: String(restaurant._id),
    deliveryAddressId: String(addressId),
    paymentMethod: "cash",
    deliveryType: "standard",
    tip: 1,
  };

  const [a, b] = await Promise.all([
    call("POST", "/api/orders/create", payload, { "Idempotency-Key": key }),
    call("POST", "/api/orders/create", payload, { "Idempotency-Key": key }),
  ]);

  const created = await Order.countDocuments({ customer: (await User.findOne({ email: EMAIL }))._id });
  ok("two concurrent taps created exactly one order", created === 1, `${created} orders`);
  ok("both responses succeeded", a.status < 400 && b.status < 400, `${a.status}/${b.status}`);

  const idA = a.body?.data?.order?._id;
  const idB = b.body?.data?.order?._id;
  ok("both responses describe the same order", idA && idA === idB, `${idA} vs ${idB}`);

  const replay = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": key });
  ok("a later retry replays rather than creating", replay.body?.idempotentReplay === true, String(replay.body?.idempotentReplay));
  ok("still exactly one order", (await Order.countDocuments({})) === 1, String(await Order.countDocuments({})));

  console.log("\nthe writes land together");
  const order = await Order.findOne({}).lean();
  ok("cart was deleted", (await Cart.countDocuments({ restaurant: restaurant._id })) === 0);
  ok("an order exists to inspect", Boolean(order));
  if (!order) throw new Error("no order was created - aborting");
  ok("the seller got a notification", (await Notification.countDocuments({ order: order._id })) === 1);
  ok("lastUsedAt was stamped on the address",
    Boolean((await mongoose.connection.db.collection("addresses").findOne({ _id: order.deliveryAddress }))?.lastUsedAt));

  console.log("\nmoney and the door code");
  const sum = Number(
    (order.subtotal + order.deliveryFee + order.serviceFee + order.priorityFee + order.tax + order.tip).toFixed(2),
  );
  ok("stored line items add up to total", sum === order.total, `${sum} vs ${order.total}`);
  ok("the door code was snapshotted for the courier", order.deliveryAddressSnapshot?.doorCode === "1234#");

  console.log("\na fresh key after a completed order starts a new one");
  await stockCart();
  const second = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": randomUUID() });
  ok("a new key places a second order", second.status === 201, String(second.status));
  ok("there are now two orders", (await Order.countDocuments({})) === 2, String(await Order.countDocuments({})));

  console.log("\na basket filled during a promotion is charged today's price");
  const cartLine = async () =>
    (await Cart.findOne({ restaurant: restaurant._id }).lean())?.items?.find((i) => String(i.menuItem) === String(item._id));
  await MenuItem.updateOne({ _id: item._id }, { $set: { promotion: { isActive: true, type: "percentage", value: 50 } } });
  await stockCart();
  ok("the line was added at the promotional price", (await cartLine())?.price === 4.75, String((await cartLine())?.price));
  await MenuItem.updateOne({ _id: item._id }, { $set: { "promotion.isActive": false } });
  const stale = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": randomUUID() });
  ok("checkout after the promotion ended is refused with 409", stale.status === 409 && stale.body.code === "PRICE_CHANGED", `${stale.status} ${stale.body.code}`);
  const change = stale.body.details?.priceChanges?.[0];
  ok("and names what changed", change?.name === "Pizza" && change.from === 4.75 && change.to === 9.5, JSON.stringify(stale.body.details));
  ok("nothing was placed", (await Order.countDocuments({})) === 2);
  ok("the basket now holds the current price", (await cartLine())?.price === 9.5 && (await cartLine())?.basePrice === undefined);
  const retried = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": randomUUID() });
  ok("placing again succeeds", retried.status === 201, String(retried.status));
  ok("at the current price", retried.body?.data?.order?.subtotal === 19, String(retried.body?.data?.order?.subtotal));

  console.log("\na price rise reaches a basket that already holds the dish");
  await stockCart();
  await MenuItem.updateOne({ _id: item._id }, { $set: { price: 12 } });
  const viewed = await call("GET", "/api/cart");
  ok("viewing the basket reports the change", viewed.body.priceChanges?.[0]?.to === 12, JSON.stringify(viewed.body).slice(0, 400));
  ok("and shows the new price", viewed.body.data?.items?.[0]?.price === 12);
  const afterView = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": randomUUID() });
  ok("a customer who saw the new price checks out without a 409", afterView.status === 201, String(afterView.status));
  ok("charged at the new price", afterView.body?.data?.order?.subtotal === 24, String(afterView.body?.data?.order?.subtotal));

  console.log("\nadding a dish again reprices its line");
  await stockCart();
  await MenuItem.updateOne({ _id: item._id }, { $set: { price: 13 } });
  await stockCart();
  const readded = await cartLine();
  ok("the line takes the current price", readded?.price === 13 && readded?.quantity === 4, JSON.stringify(readded));
  await Cart.deleteMany({});

  console.log("\nunavailable and deleted dishes are refused cleanly");
  await stockCart();
  await MenuItem.updateOne({ _id: item._id }, { $set: { available: false } });
  const off = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": randomUUID() });
  ok("an unavailable dish is a 400 ITEM_UNAVAILABLE", off.status === 400 && off.body.code === "ITEM_UNAVAILABLE", `${off.status} ${off.body.code}`);
  await MenuItem.updateOne({ _id: item._id }, { $set: { available: true } });
  await Cart.updateOne(
    { restaurant: restaurant._id },
    { $push: { items: { menuItem: new mongoose.Types.ObjectId(), name: "Removed dish", price: 5, quantity: 1 } } },
  );
  const gone = await call("POST", "/api/orders/create", payload, { "Idempotency-Key": randomUUID() });
  ok("a deleted dish is a 400, not a crash", gone.status === 400 && gone.body.code === "ITEM_UNAVAILABLE", `${gone.status} ${gone.body.code}`);
  ok("naming the dish", gone.body.message?.includes("Removed dish"), gone.body.message);
  await MenuItem.updateOne({ _id: item._id }, { $set: { price: 14 } });
  const mixed = await call("GET", "/api/cart");
  ok(
    "a basket holding a deleted dish still reprices the rest",
    mixed.status === 200 && mixed.body.priceChanges?.[0]?.to === 14,
    `${mixed.status} ${JSON.stringify(mixed.body).slice(0, 160)}`,
  );

  await mongoose.disconnect();
  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  child.kill();
  await repl.stop();
}
