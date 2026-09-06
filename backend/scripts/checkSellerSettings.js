/**
 * Seller settings contract, driven the way the mobile autosave drives it.
 *
 * The day-by-day schedule merge is the part worth pinning: a partial payload
 * must never wipe the days it did not mention, and isOpenNow is precomputed
 * rather than derived, so it has to be recalculated inline on every change.
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

const login = async (email) => {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client": "mobile" },
    body: JSON.stringify({ email, password: "smoketest123" }),
  });
  return (await r.json()).token;
};

// Mirrors src/services/apiRestaurant.js#updateRestaurant.
const put = async (token, { schedule, ...fields }) => {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(k, String(v));
  for (const [day, entry] of Object.entries(schedule ?? {})) {
    for (const [key, value] of Object.entries(entry)) {
      body.append(`schedule[${day}][${key}]`, String(value));
    }
  }
  const r = await fetch(`${API}/restaurants/update`, {
    method: "PUT",
    headers: { "X-Client": "mobile", Authorization: `Bearer ${token}` },
    body,
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

await mongoose.connect(process.env.MONGODB_URL);
const User = (await import("../models/User.js")).default;
const Restaurant = (await import("../models/Restaurant.js")).default;

const seller = await User.findOne({
  email: /^smoke-seller-.*@smoke\.test$/,
}).lean();
const customer = await User.findOne({
  email: /^smoke-customer-.*@smoke\.test$/,
}).lean();
const token = await login(seller.email);
const customerToken = await login(customer.email);
const read = () => Restaurant.findOne({ ownerId: seller._id }).lean();

console.log("\nprofile fields");
const info = await put(token, {
  name: "Settings Check Diner",
  description: "Updated by the settings contract check.",
  phone: "0600000999",
  estimatedDeliveryTime: "25-40 min",
});
ok(
  "partial profile update accepted",
  info.status < 400,
  `${info.status} ${info.body.message}`,
);
let stored = await read();
ok("name persisted", stored.name === "Settings Check Diner", stored.name);
ok(
  "delivery estimate persisted",
  stored.estimatedDeliveryTime === "25-40 min",
  stored.estimatedDeliveryTime,
);
ok("untouched fields survive", Boolean(stored.email && stored.cuisineType));

console.log("\nschedule: one day only");
const before = await read();
const mondayOnly = await put(token, {
  schedule: {
    monday: { isOpen: true, openingTime: "08:15", closingTime: "23:45" },
  },
});
ok(
  "single-day payload accepted",
  mondayOnly.status < 400,
  `${mondayOnly.status} ${mondayOnly.body.message}`,
);
stored = await read();
ok(
  "monday changed",
  stored.schedule.monday.openingTime === "08:15" &&
    stored.schedule.monday.closingTime === "23:45",
  JSON.stringify(stored.schedule.monday),
);
ok(
  "tuesday was not wiped",
  stored.schedule.tuesday.openingTime === before.schedule.tuesday.openingTime &&
    stored.schedule.tuesday.isOpen === before.schedule.tuesday.isOpen,
  JSON.stringify(stored.schedule.tuesday),
);

console.log("\nboolean coercion over multipart");
const closed = await put(token, { schedule: { sunday: { isOpen: false } } });
ok(
  "isOpen:false accepted as a string",
  closed.status < 400,
  `${closed.status} ${closed.body.message}`,
);
stored = await read();
ok(
  'the string "false" became a real boolean',
  stored.schedule.sunday.isOpen === false,
  JSON.stringify(stored.schedule.sunday.isOpen),
);

console.log("\nisOpenNow is recomputed, not left stale");
// Closed every day: whatever the cron last wrote, this must be false now.
const allDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
await put(token, {
  schedule: Object.fromEntries(allDays.map((day) => [day, { isOpen: false }])),
});
stored = await read();
ok(
  "closed all week means isOpenNow is false",
  stored.isOpenNow === false,
  String(stored.isOpenNow),
);

await put(token, {
  schedule: Object.fromEntries(
    allDays.map((day) => [
      day,
      { isOpen: true, openingTime: "00:00", closingTime: "23:59" },
    ]),
  ),
});
stored = await read();
ok(
  "open all week means isOpenNow is true",
  stored.isOpenNow === true,
  String(stored.isOpenNow),
);

console.log("\nvalidation");
const badTime = await put(token, {
  schedule: { monday: { isOpen: true, openingTime: "9am" } },
});
ok(
  "a malformed time is refused",
  badTime.status >= 400,
  `got ${badTime.status}`,
);

const badEmail = await put(token, { email: "not-an-email" });
ok(
  "a malformed email is refused",
  badEmail.status >= 400,
  `got ${badEmail.status}`,
);

console.log("\nownership");
const asCustomer = await put(customerToken, { name: "Not allowed" });
ok(
  "a customer cannot update a restaurant",
  asCustomer.status >= 400,
  `got ${asCustomer.status}`,
);

console.log("\nrestore");
await Restaurant.updateOne(
  { ownerId: seller._id },
  {
    name: before.name,
    description: before.description,
    phone: before.phone,
    estimatedDeliveryTime: before.estimatedDeliveryTime,
    schedule: before.schedule,
    isOpenNow: before.isOpenNow,
  },
);
console.log("  fixture restaurant restored");

await mongoose.disconnect();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
