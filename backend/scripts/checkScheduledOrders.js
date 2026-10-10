// Scheduled orders: a closed restaurant takes pre-orders, checkout validates
// the slot with the same rule the clients build their picker from, the order
// waits as "scheduled" and the cron releases it to the kitchen as a normal
// pending order, whose timeout counts from the release.
//
// Slots are computed from the real clock with the shared functions, so this
// passes whatever time of day it runs.
//
//   node scripts/checkScheduledOrders.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";
import { SCHEDULING, deliverySlots, schedulingInputs, slotProblem } from "@chowgo/shared/scheduling";

const PORT = 9950 + Math.floor(Math.random() * 40);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const MINUTE = 60 * 1000;

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = repl.getUri();
process.env.MONGODB_URL = uri;
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

  await mongoose.connect(uri);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Order } = await import("../models/Order.js");
  const { default: Cart } = await import("../models/Cart.js");
  const { generateToken } = await import("../utils/generateToken.js");
  const recovery = await import("../services/orderRecovery.service.js");
  const restaurantOrders = await import("../services/restaurantOrder.service.js");
  await Order.init();

  const buyer = await User.create({ name: "B", email: "b@sched.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const token = generateToken(buyer, null, false, { skipCookie: true });

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekly = (entry) => Object.fromEntries(days.map((day) => [day, entry]));
  // Mornings only: there are always slots ahead, and always afternoons the
  // kitchen is shut for.
  const mornings = weekly({ isOpen: true, openingTime: "06:00", closingTime: "12:00" });
  const shut = weekly({ isOpen: false, openingTime: "09:00", closingTime: "17:00" });

  let tag = 0;
  const makeRestaurant = async (schedule, extra = {}) => {
    const owner = await User.create({ name: "O", email: `o${++tag}@sched.test`, password: "x", role: "seller" });
    const restaurant = await Restaurant.create({
      ownerId: owner._id, name: `R${tag}`, email: `r${tag}@sched.test`, phone: "0622222222", cuisineType: "pizza",
      description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] },
      isActive: true, isOpenNow: false, schedule, timezone: "Europe/Belgrade", ...extra,
    });
    const dish = await MenuItem.create({
      restaurant: restaurant._id, owner: owner._id, name: "Pizza", description: "d", price: 900, category: "Pizza",
      available: true, imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
    });
    return { owner, restaurant, dish };
  };

  const call = async (method, p, body) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", Authorization: `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const addr = await call("POST", "/api/delivery-address", {
    address: "Knez Mihailova 10", label: "Home", type: "apartment", location: { lat: 44.81, lng: 20.46 },
  });
  const addressId = addr.body?.address?._id ?? addr.body?.data?.address?._id ?? addr.body?.data?._id;

  const morning = await makeRestaurant(mornings);
  const closedAllWeek = await makeRestaurant(shut);

  console.log("\nthe basket");
  let r = await call("POST", "/api/cart/items", { menuItemId: String(closedAllWeek.dish._id) });
  ok("a restaurant shut all week still refuses the basket", r.body?.code === "RESTAURANT_CLOSED", `${r.status} ${r.body?.code}`);
  r = await call("POST", "/api/cart/items", { menuItemId: String(morning.dish._id), quantity: 2 });
  ok("a closed restaurant with slots ahead accepts the basket for a pre-order", r.status === 200, `${r.status} ${r.body?.code}`);

  const inputs = schedulingInputs(morning.restaurant.toObject());
  const slots = deliverySlots(inputs);
  ok("there are slots to pick from", slots.length > 0);
  const slot = slots[0];
  let kitchenShut = null;
  const firstAligned = Math.ceil((Date.now() + 2 * 60 * MINUTE) / (15 * MINUTE)) * 15 * MINUTE;
  for (let time = firstAligned; time < Date.now() + 2.5 * 24 * 60 * MINUTE; time += 15 * MINUTE) {
    if (slotProblem(inputs, time) === "SCHEDULE_CLOSED") { kitchenShut = new Date(time); break; }
  }

  const checkout = (extra) =>
    call("POST", "/api/orders/create", {
      restaurantId: String(morning.restaurant._id), deliveryAddressId: String(addressId), paymentMethod: "cash",
      deliveryType: "standard", ...extra,
    });

  console.log("\ncheckout refusals");
  r = await checkout({});
  ok("ordering for now from a closed restaurant is refused", r.body?.code === "RESTAURANT_CLOSED", `${r.status} ${r.body?.code}`);
  r = await checkout({ scheduledFor: new Date(slot.getTime() + 7 * MINUTE).toISOString() });
  ok("a time off the quarter-hour grid is SCHEDULE_INVALID", r.body?.code === "SCHEDULE_INVALID", r.body?.code);
  r = await checkout({ scheduledFor: "tomorrow-ish" });
  ok("a time that is not a date is SCHEDULE_INVALID", r.body?.code === "SCHEDULE_INVALID", r.body?.code);
  r = await checkout({ scheduledFor: new Date(Math.ceil((Date.now() + 20 * MINUTE) / (15 * MINUTE)) * 15 * MINUTE).toISOString() });
  ok("a time inside the minimum lead is SCHEDULE_TOO_SOON", r.body?.code === "SCHEDULE_TOO_SOON", r.body?.code);
  r = await checkout({ scheduledFor: new Date(Math.ceil((Date.now() + 4 * 24 * 60 * MINUTE) / (15 * MINUTE)) * 15 * MINUTE).toISOString() });
  ok("a time past the horizon is SCHEDULE_TOO_FAR", r.body?.code === "SCHEDULE_TOO_FAR", r.body?.code);
  r = await checkout({ scheduledFor: kitchenShut?.toISOString() });
  ok("a time the kitchen would be shut for is SCHEDULE_CLOSED, as the shared rule says",
    kitchenShut && r.body?.code === "SCHEDULE_CLOSED", `${kitchenShut?.toISOString()} ${r.body?.code}`);
  ok("the refusals placed nothing", (await Order.countDocuments({})) === 0);

  console.log("\na scheduled checkout");
  r = await checkout({ scheduledFor: slot.toISOString(), deliveryType: "priority" });
  ok("the first offered slot is accepted", r.status === 201, `${r.status} ${r.body?.code} ${r.body?.message}`);
  let order = await Order.findOne({}).lean();
  ok("it waits as scheduled", order?.status === "scheduled", order?.status);
  ok("for the chosen time", order?.scheduledFor?.getTime() === slot.getTime());
  ok("which is also its arrival estimate", order?.estimatedDeliveryTime?.getTime() === slot.getTime());
  ok("released to the kitchen an hour before (30 prep + 30 travel)",
    order?.releaseAt?.getTime() === slot.getTime() - 60 * MINUTE, order?.releaseAt?.toISOString());
  ok("priority is not charged on a booked order", order?.priorityFee === 0, String(order?.priorityFee));
  ok("the basket was used up", (await Cart.countDocuments({ user: buyer._id })) === 0);
  const seen = await call("GET", "/api/orders/my-orders?status=active");
  ok("it is listed among the customer's active orders",
    JSON.stringify(seen.body).includes(String(order._id)), JSON.stringify(seen.body).slice(0, 120));

  console.log("\nrelease to the kitchen");
  await recovery.releaseDueScheduledOrders(new Date(order.releaseAt.getTime() - MINUTE));
  ok("a minute early it is still scheduled", (await Order.findById(order._id).lean()).status === "scheduled");
  await recovery.rejectStalePendingOrders(new Date(slot.getTime() + 24 * 60 * MINUTE));
  ok("the pending timeout never touches a scheduled order", (await Order.findById(order._id).lean()).status === "scheduled");
  const releaseMoment = new Date(order.releaseAt.getTime() + 1000);
  const released = await recovery.releaseDueScheduledOrders(releaseMoment);
  order = await Order.findById(order._id).lean();
  ok("at its release time it becomes a pending order", released === 1 && order.status === "pending", `${released} ${order.status}`);
  ok("stamped with when it was released", order.releasedAt?.getTime() === releaseMoment.getTime());
  ok("releasing again does nothing", (await recovery.releaseDueScheduledOrders(releaseMoment)) === 0);

  await Order.updateOne({ _id: order._id }, { $set: { createdAt: new Date(Date.now() - 3 * 24 * 60 * MINUTE) } });
  await recovery.rejectStalePendingOrders(new Date(releaseMoment.getTime() + 10 * MINUTE));
  ok("an order booked days ago is not timed out the moment it is released",
    (await Order.findById(order._id).lean()).status === "pending");
  await recovery.rejectStalePendingOrders(new Date(releaseMoment.getTime() + 16 * MINUTE));
  ok("but is once the restaurant has ignored it for the usual 15 minutes",
    (await Order.findById(order._id).lean()).status === "rejected");

  console.log("\ncancelling and rejecting before release");
  const placeAnother = async (when) => {
    await call("POST", "/api/cart/items", { menuItemId: String(morning.dish._id) });
    const placed = await checkout({ scheduledFor: when.toISOString() });
    return placed.body?.data?.order?._id;
  };
  const toCancel = await placeAnother(slots[1] ?? slot);
  r = await call("PATCH", `/api/orders/${toCancel}/cancel`, { reason: "Plans changed" });
  ok("the customer can cancel a scheduled order", r.status === 200 && (await Order.findById(toCancel).lean()).status === "cancelled",
    `${r.status} ${r.body?.code}`);
  const toReject = await placeAnother(slots[2] ?? slot);
  await restaurantOrders.rejectOrderOperation(toReject, morning.restaurant._id, "Closed for a private event");
  ok("the restaurant can turn one down before it is released", (await Order.findById(toReject).lean()).status === "rejected");

  console.log("\nordering now is unchanged");
  await Restaurant.updateOne({ _id: morning.restaurant._id }, { $set: { isOpenNow: true } });
  await call("POST", "/api/cart/items", { menuItemId: String(morning.dish._id) });
  r = await checkout({});
  const now = await Order.findById(r.body?.data?.order?._id).lean();
  ok("an open restaurant still takes an order for now as pending", now?.status === "pending" && !now?.scheduledFor,
    `${r.status} ${r.body?.code} ${now?.status}`);
  ok("SCHEDULING lead time is the documented 45 minutes", SCHEDULING.minLeadMinutes === 45);
} finally {
  child.kill();
  await mongoose.disconnect();
  await repl.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
