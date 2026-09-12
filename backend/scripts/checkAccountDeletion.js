// In-app account deletion, against a throwaway replica set.
//
// App Store Review Guideline 5.1.1(v) has required this of any app that lets
// people create an account since June 2022, and Google Play requires it too.
// There was no endpoint at all.
//
// Deletion anonymises rather than removes: orders are the restaurant's and the
// courier's records as well as the customer's. These assert that the personal
// data is gone, the commercial record survives, and the session dies with it.
//
//   node scripts/checkAccountDeletion.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 8700 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const stamp = Date.now();
const EMAIL = `leaver-${stamp}@delete.test`;
const PASSWORD = "leavingnow123";

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
    ...process.env, MONGODB_URL: uri, PORT: String(PORT),
    JWT_SECRET: randomBytes(48).toString("base64url"),
    NODE_ENV: "development", LOG_LEVEL: "silent",
  },
  stdio: ["ignore", "ignore", "inherit"],
});

let token = null;
async function call(method, p, body, headers = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: {
      "Content-Type": "application/json", "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers,
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
  const { default: Order } = await import("../models/Order.js");
  const { default: Addresses } = await import("../models/Addresses.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  await Order.init();

  const reg = await call("POST", "/api/auth/register", {
    email: EMAIL, name: "Ana Leaver", password: PASSWORD,
    role: "customer", phoneNumber: "0600123456",
  });
  token = reg.body?.token;
  ok("registered", Boolean(token));
  const userId = reg.body?._id;

  await call("POST", "/api/delivery-address", {
    address: "Knez Mihailova 10", label: "Home", type: "apartment",
    location: { lat: 44.81, lng: 20.46 }, doorCode: "1234#",
  });

  const owner = await User.create({ name: "O", email: `o-${stamp}@delete.test`, password: "x", role: "seller" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: `r-${stamp}@delete.test`, phone: "0622222222",
    cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });

  const makeOrder = (status) =>
    Order.create({
      customer: userId, restaurant: restaurant._id, status,
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 9.5, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: {
        label: "Home", fullAddress: "Knez Mihailova 10", apartment: "12B",
        doorCode: "1234#", notes: "ring twice",
        location: { type: "Point", coordinates: [20.46, 44.81] },
      },
      customerNotes: "extra napkins",
      subtotal: 9.5, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 0,
      tax: 0, total: 13.5, paymentMethod: "cash",
    });

  console.log("\nan order in flight blocks deletion");
  const live = await makeOrder("preparing");
  let attempt = await call("DELETE", "/api/auth/account", { password: PASSWORD });
  ok("refused while an order is active", attempt.body?.code === "ACTIVE_ORDER", attempt.body?.code);
  ok("the account still works", (await call("GET", "/api/auth/check")).status === 200);

  await Order.updateOne({ _id: live._id }, { $set: { status: "delivered", deliveredAt: new Date() } });

  console.log("\nthe password is required, and must be right");
  ok("refused with no password",
    (await call("DELETE", "/api/auth/account", {})).body?.code === "PASSWORD_REQUIRED");
  ok("refused with the wrong password",
    (await call("DELETE", "/api/auth/account", { password: "notmypassword" })).body?.code === "PASSWORD_INCORRECT");
  ok("still not deleted", (await User.findById(userId)).isDeleted !== true);

  console.log("\ndeleting");
  const done = await call("DELETE", "/api/auth/account", { password: PASSWORD });
  ok("deletion succeeded", done.status === 200, JSON.stringify(done.body).slice(0, 120));

  const tombstone = await User.findById(userId).select("+pushTokens").lean();
  ok("the row survives as a tombstone", Boolean(tombstone) && tombstone.isDeleted === true);
  ok("the name is gone", tombstone.name === "Deleted account", tombstone.name);
  ok("the email is gone", !tombstone.email.includes("leaver") && tombstone.email.endsWith("@deleted.invalid"), tombstone.email);
  ok("the phone number is gone", !tombstone.phoneNumber, String(tombstone.phoneNumber));
  ok("push tokens are gone", (tombstone.pushTokens ?? []).length === 0);
  ok("deletedAt is stamped", Boolean(tombstone.deletedAt));

  ok("saved addresses are deleted", (await Addresses.countDocuments({ userId })) === 0);

  console.log("\nthe commercial record survives, without the personal data");
  const order = await Order.findById(live._id).lean();
  ok("the order still exists", Boolean(order));
  ok("its totals are untouched", order.total === 13.5 && order.serviceFee === 1.5);
  ok("the door code is gone", !order.deliveryAddressSnapshot?.doorCode, order.deliveryAddressSnapshot?.doorCode);
  ok("the apartment is gone", !order.deliveryAddressSnapshot?.apartment);
  ok("the street address is redacted", order.deliveryAddressSnapshot?.fullAddress === "[deleted]", order.deliveryAddressSnapshot?.fullAddress);
  ok("the delivery notes are gone", !order.deliveryAddressSnapshot?.notes);
  ok("the customer note is gone", order.customerNotes === "", `"${order.customerNotes}"`);

  console.log("\nthe session dies with the account");
  const after = await call("GET", "/api/auth/check");
  ok("the old token is refused", after.status === 401, String(after.status));
  ok("and cannot log back in",
    (await call("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD })).status === 400);
  ok("the email is free to register again",
    (await call("POST", "/api/auth/register", {
      email: EMAIL, name: "Someone Else", password: "adifferentpass1",
      role: "customer", phoneNumber: "0600999999",
    })).status === 201);

  await mongoose.disconnect();
  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  child.kill();
  await repl.stop();
}
