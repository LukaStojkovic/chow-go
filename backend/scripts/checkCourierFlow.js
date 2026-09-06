/**
 * Courier contract, driven the way the mobile client drives it.
 *
 * The claim is the interesting part: it is the one race-safe write in the
 * codebase, a single findOneAndUpdate filtered on { status: "ready",
 * courier: null }, so two couriers reaching for the same order must produce one
 * winner and one ordinary refusal.
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const API = "http://localhost:8000/api";
let passed = 0;
let failed = 0;
const ok = (l, c, d = "") => {
  c ? passed++ : failed++;
  console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${d && !c ? ` - ${d}` : ""}`);
};

const call = async (m, p, token, b) => {
  const r = await fetch(`${API}${p}`, {
    method: m,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: b === undefined ? undefined : JSON.stringify(b),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

await mongoose.connect(process.env.MONGODB_URL);
const User = (await import("../models/User.js")).default;
const Courier = (await import("../models/Courier.js")).default;
const MenuItem = (await import("../models/MenuItem.js")).default;
const Order = (await import("../models/Order.js")).default;
const Addresses = (await import("../models/Addresses.js")).default;

const login = async (email) =>
  (await call("POST", "/auth/login", null, { email, password: "smoketest123" }))
    .body.token;

const customer = await User.findOne({
  email: /^smoke-customer-.*@smoke\.test$/,
}).lean();
const seller = await User.findOne({
  email: /^smoke-seller-.*@smoke\.test$/,
}).lean();
const courierUser = await User.findOne({
  email: /^smoke-courier-.*@smoke\.test$/,
}).lean();

const customerToken = await login(customer.email);
const sellerToken = await login(seller.email);
const courierToken = await login(courierUser.email);

const item = await MenuItem.findOne({ name: "Smoke Burger" }).lean();
await call("POST", "/delivery-address", customerToken, {
  address: "Terazije 10",
  label: "Home",
  type: "apartment",
  location: { lat: 44.8125, lng: 20.4612 },
});
const address = ((await call("GET", "/delivery-address", customerToken)).body
  .data ?? [])[0];

async function readyOrder() {
  await call("POST", "/cart/items", customerToken, {
    menuItemId: String(item._id),
    quantity: 1,
  });
  const created = await call("POST", "/orders/create", customerToken, {
    restaurantId: String(item.restaurant),
    deliveryAddressId: String(address._id),
    paymentMethod: "cash",
    deliveryType: "standard",
  });
  const order = created.body.data.order;
  await call("PATCH", `/restaurant/orders/${order._id}/confirm`, sellerToken, {
    estimatedPreparationTime: 15,
  });
  await call("PATCH", `/restaurant/orders/${order._id}/status`, sellerToken, {
    status: "preparing",
  });
  await call("PATCH", `/restaurant/orders/${order._id}/status`, sellerToken, {
    status: "ready",
  });
  return order;
}

console.log("\nduty status");
const off = await call("PATCH", "/courier/duty-status", courierToken, {
  isAvailable: false,
});
ok(
  "going off duty is accepted",
  off.status < 400,
  `${off.status} ${off.body.message}`,
);
ok(
  "it persists",
  (await Courier.findOne({ userId: courierUser._id }).lean()).isAvailable ===
    false,
);
await call("PATCH", "/courier/duty-status", courierToken, {
  isAvailable: true,
});

console.log("\nthe pool");
const order = await readyOrder();
const pool = await call("GET", "/courier/available", courierToken);
ok(
  "unwraps to data.orders",
  Array.isArray(pool.body.data?.orders),
  JSON.stringify(Object.keys(pool.body.data ?? {})),
);
ok(
  "a ready order is offered",
  (pool.body.data?.orders ?? []).some(
    (o) => String(o._id) === String(order._id),
  ),
);
const offered = (pool.body.data?.orders ?? []).find(
  (o) => String(o._id) === String(order._id),
);
ok(
  "the card can show the fee and address",
  offered?.deliveryFee !== undefined &&
    Boolean(offered?.deliveryAddressSnapshot?.fullAddress),
);

console.log("\nclaiming is race-safe");
const [first, second] = await Promise.all([
  call("PATCH", `/courier/${order._id}/accept`, courierToken),
  call("PATCH", `/courier/${order._id}/accept`, courierToken),
]);
const winners = [first, second].filter((r) => r.status < 400).length;
ok(
  "exactly one of two simultaneous claims wins",
  winners === 1,
  `${winners} succeeded`,
);

const claimed = await Order.findById(order._id).lean();
ok("the order is assigned", claimed.status === "assigned", claimed.status);

console.log("\nit leaves the pool");
const afterClaim = await call("GET", "/courier/available", courierToken);
ok(
  "a claimed order is no longer offered",
  !(afterClaim.body.data?.orders ?? []).some(
    (o) => String(o._id) === String(order._id),
  ),
);

console.log("\nactive list and detail");
const active = await call(
  "GET",
  "/courier/my-orders?status=active",
  courierToken,
);
ok(
  "it appears under active",
  (active.body.data?.orders ?? []).some(
    (o) => String(o._id) === String(order._id),
  ),
);
const detail = await call(
  "GET",
  `/courier/my-orders/${order._id}`,
  courierToken,
);
const detailOrder = detail.body.data?.order ?? detail.body.data;
ok("detail unwraps the way the service expects", Boolean(detailOrder?._id));
ok(
  "restaurant coordinates are present for the map",
  Array.isArray(detailOrder?.restaurant?.location?.coordinates),
);
ok(
  "delivery coordinates are present for the map",
  Array.isArray(detailOrder?.deliveryAddressSnapshot?.location?.coordinates),
);
ok(
  "customer phone is present for the call button",
  Boolean(detailOrder?.customer?.phoneNumber),
);

console.log("\nthe swipe sequence");
for (const [action, expected] of [
  ["picked-up", "picked_up"],
  ["in-transit", "in_transit"],
  ["delivered", "delivered"],
]) {
  const step = await call(
    "PATCH",
    `/courier/${order._id}/${action}`,
    courierToken,
  );
  ok(
    `${action} accepted`,
    step.status < 400,
    `${step.status} ${step.body.message}`,
  );
  const now = await Order.findById(order._id).lean();
  ok(`status is ${expected}`, now.status === expected, now.status);
}

console.log("\nreleasing back to the pool");
const second_order = await readyOrder();
await call("PATCH", `/courier/${second_order._id}/accept`, courierToken);
const released = await call(
  "PATCH",
  `/courier/${second_order._id}/cancel`,
  courierToken,
  {
    reason: "Cannot complete this delivery",
  },
);
ok(
  "release accepted",
  released.status < 400,
  `${released.status} ${released.body.message}`,
);
const backInPool = await call("GET", "/courier/available", courierToken);
ok(
  "it is offered again",
  (backInPool.body.data?.orders ?? []).some(
    (o) => String(o._id) === String(second_order._id),
  ),
);

console.log("\noverview and profile");
const overview = await call("GET", "/courier/my-overview", courierToken);
const analytics = overview.body.data?.analytics;
ok("overview unwraps to data.analytics", Boolean(analytics));
ok(
  "today/week/month carry earnings",
  ["today", "week", "month"].every(
    (k) => typeof analytics?.[k]?.earnings === "number",
  ),
);
ok(
  "chartData is seven days",
  Array.isArray(analytics?.chartData) && analytics.chartData.length === 7,
  String(analytics?.chartData?.length),
);
ok(
  "allTime carries the stats the list shows",
  typeof analytics?.allTime?.acceptanceRate === "number",
);

const profile = await call("GET", "/courier/profile", courierToken);
ok("profile unwraps to data.courier", Boolean(profile.body.data?.courier?._id));
ok(
  "it carries the fields the screen renders",
  Boolean(
    profile.body.data?.courier?.fullName &&
    profile.body.data?.courier?.vehicleType,
  ),
);

console.log("\nownership");
ok(
  "a customer cannot read the pool",
  (await call("GET", "/courier/available", customerToken)).status >= 400,
);
ok(
  "a customer cannot toggle duty",
  (
    await call("PATCH", "/courier/duty-status", customerToken, {
      isAvailable: true,
    })
  ).status >= 400,
);

console.log("\ncleanup");
await Order.deleteMany({ _id: { $in: [order._id, second_order._id] } });
await Addresses.deleteMany({ userId: customer._id });
console.log("  done");

await mongoose.disconnect();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
