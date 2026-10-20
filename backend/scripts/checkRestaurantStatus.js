// Busy and pause mode end to end: pausing stops orders at once and expires on
// its own, resuming reopens, pre-order slots skip the pause, busy adds prep
// time to new orders and to what customers see, and every change reaches the
// restaurant's sockets.
//
//   node scripts/checkRestaurantStatus.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";
import { io as connectSocket } from "socket.io-client";

const PORT = 11100 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGODB_URL = replSet.getUri();
process.env.JWT_SECRET = randomBytes(48).toString("base64url");
process.env.LOG_LEVEL = "silent";

const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", MAIL_DISABLED: "true", REDIS_URL: "" },
  stdio: ["ignore", "ignore", "inherit"],
});

let socket;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Addresses } = await import("../models/Addresses.js");
  const { default: Order } = await import("../models/Order.js");
  const { generateToken } = await import("../utils/generateToken.js");
  const { computeIsOpenNow } = await import("../utils/restaurantAvailability.js");
  const { deliverySlots, schedulingInputs } = await import("@chowgo/shared/scheduling");
  const { toRestaurantView, unavailableReason } = await import("@chowgo/shared/adapters/restaurant");
  const { initI18n } = await import("@chowgo/shared/i18n");
  initI18n({ locale: "en" });

  const token = (user) => generateToken(user, null, false, { skipCookie: true });
  const call = async (method, p, auth, body) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", Authorization: `Bearer ${auth}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const owner = await User.create({ name: "O", email: "o@status.test", password: "x", role: "seller" });
  const customer = await User.create({ name: "C", email: "c@status.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const allDay = Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => [d, { isOpen: true, openingTime: "00:00", closingTime: "00:00" }]),
  );
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "Status R", email: "r@status.test", phone: "0622222222", cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true, schedule: allDay, currency: "RSD",
    estimatedDeliveryTime: "30-45 min",
  });
  const dish = await MenuItem.create({
    restaurant: restaurant._id, owner: owner._id, name: "Pizza", description: "d", price: 1000, category: "Pizza", available: true,
    imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
  });
  const address = await Addresses.create({
    userId: customer._id, label: "Home", addressType: "house", fullAddress: "A 1", location: { type: "Point", coordinates: [20.46, 44.81] },
  });
  const sellerToken = token(owner);
  const customerToken = token(customer);

  const events = [];
  socket = connectSocket(BASE, { transports: ["websocket"], auth: { token: sellerToken }, reconnection: false });
  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("connect_error", reject);
  });
  socket.emit("register", { role: "seller", restaurantId: String(restaurant._id) });
  socket.on("restaurant:status", (payload) => events.push(payload));
  await new Promise((r) => setTimeout(r, 300));

  const order = async () => {
    await call("POST", "/api/cart/items", customerToken, { menuItemId: String(dish._id), quantity: 1 });
    return call("POST", "/api/orders/create", customerToken, {
      restaurantId: String(restaurant._id), deliveryAddressId: String(address._id), paymentMethod: "cash", deliveryType: "standard",
    });
  };

  console.log("\nvalidation");
  let r = await call("POST", "/api/restaurant/status", sellerToken, { action: "nap" });
  ok("an unknown action is refused", r.status === 400 && r.body?.code === "STATUS_ACTION_INVALID", `${r.status} ${r.body?.code}`);
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "busy", extraMinutes: 90, minutes: 30 });
  ok("busy is capped at 60 extra minutes", r.body?.code === "STATUS_ACTION_INVALID" && r.body?.details?.field === "extraMinutes");
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "pause", minutes: 3 });
  ok("a pause shorter than 5 minutes is refused", r.body?.code === "STATUS_ACTION_INVALID");
  r = await call("POST", "/api/restaurant/status", customerToken, { action: "resume" });
  ok("customers cannot change it", r.status === 403);

  console.log("\npause");
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "pause", minutes: 30, reason: "  Oven repair " });
  ok("a pause stops orders at once", r.status === 200 && r.body?.data?.isOpenNow === false && r.body.data.pause?.reason === "Oven repair" &&
    r.body.data.scheduleOpen === true && (await Restaurant.findById(restaurant._id).lean()).isOpenNow === false, JSON.stringify(r.body).slice(0, 200));
  await new Promise((resolve) => setTimeout(resolve, 200));
  ok("and reaches the restaurant's sockets", events.at(-1)?.status?.pause?.reason === "Oven repair", JSON.stringify(events.at(-1)));
  r = await order();
  ok("an order for now is refused while paused", r.status === 400 && r.body?.code === "RESTAURANT_CLOSED", `${r.status} ${r.body?.code}`);
  let stored = await Restaurant.findById(restaurant._id).lean();
  const slots = deliverySlots(schedulingInputs(stored));
  const pauseEnds = new Date(stored.pause.until);
  ok("pre-order slots start after the pause", slots.length > 0 && slots.every((s) => s.getTime() - 60 * 60_000 >= pauseEnds.getTime()),
    `${slots[0]?.toISOString()} vs ${pauseEnds.toISOString()}`);
  const view = toRestaurantView({ ...stored, isOpenNow: false });
  ok("customers are told when it is back", /^Not taking orders right now\. Back at/.test(unavailableReason(view) ?? ""), unavailableReason(view));

  await Restaurant.updateOne({ _id: restaurant._id }, { $set: { "pause.until": new Date(Date.now() - 1000) } });
  stored = await Restaurant.findById(restaurant._id).lean();
  ok("an expired pause no longer counts", computeIsOpenNow(stored) === true);
  r = await call("GET", "/api/restaurant/status", sellerToken);
  ok("and the status reads open with no pause", r.body?.data?.isOpenNow === true && r.body.data.pause === null, JSON.stringify(r.body?.data));

  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "pause", until: "indefinite" });
  stored = await Restaurant.findById(restaurant._id).lean();
  ok("a pause until resumed has no end and no pre-order slots", r.body?.data?.pause?.indefinite === true &&
    deliverySlots(schedulingInputs(stored)).length === 0);
  ok("customers see it without a time", unavailableReason(toRestaurantView({ ...stored, isOpenNow: false })) === "Not taking orders right now.");
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "pause", until: "endOfDay" });
  ok("a pause until the end of the day ends at local midnight", new Date(r.body?.data?.pause?.until).getTime() > Date.now() &&
    new Date(r.body.data.pause.until).getTime() - Date.now() <= 24 * 3600_000);
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "resume" });
  ok("resume reopens", r.body?.data?.isOpenNow === true && r.body.data.pause === null);

  console.log("\nbusy");
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "busy", extraMinutes: 15, minutes: 60 });
  ok("busy keeps the restaurant open", r.body?.data?.isOpenNow === true && r.body.data.busy?.extraMinutes === 15, JSON.stringify(r.body?.data));
  stored = await Restaurant.findById(restaurant._id).lean();
  ok("customers see the longer estimate", toRestaurantView(stored).deliveryEstimate === "45-60 min" && toRestaurantView(stored).busyExtraMinutes === 15);
  r = await order();
  const placed = await Order.findById(r.body?.data?.order?._id).lean();
  ok("a new order gets the extra prep time", placed?.estimatedPreparationTime === 45 &&
    new Date(placed.estimatedDeliveryTime).getTime() - new Date(placed.createdAt).getTime() >= 74 * 60_000, `${r.status} ${placed?.estimatedPreparationTime}`);
  r = await call("PATCH", `/api/restaurant/orders/${placed?._id}/confirm`, sellerToken, {});
  const confirmed = await Order.findById(placed?._id).lean();
  ok("accepting without a prep time defaults to the busy one", confirmed?.status === "confirmed" && confirmed.estimatedPreparationTime === 45,
    `${r.status} ${confirmed?.status} ${confirmed?.estimatedPreparationTime}`);
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "normal" });
  stored = await Restaurant.findById(restaurant._id).lean();
  ok("back to normal clears it", r.body?.data?.busy === null && toRestaurantView(stored).deliveryEstimate === "30-45 min");

  console.log("\nwith closures and the schedule");
  await call("PUT", "/api/restaurant/closures", sellerToken, { closures: [] });
  r = await call("POST", "/api/restaurant/status", sellerToken, { action: "pause", minutes: 60 });
  r = await call("PUT", "/api/restaurant/closures", sellerToken, { closures: [] });
  ok("saving closures keeps a running pause closed", r.body?.data?.isOpenNow === false);
  await call("POST", "/api/restaurant/status", sellerToken, { action: "resume" });
} finally {
  socket?.close();
  child.kill();
  await mongoose.disconnect();
  await replSet.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
