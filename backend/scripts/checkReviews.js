// Reviews end to end: quick tags stored with a rating, the public review list
// with its summary, the seller's list and filters, and public replies.
//
//   node scripts/checkReviews.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 10300 + Math.floor(Math.random() * 200);
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
  const { default: Order } = await import("../models/Order.js");
  await import("../models/MenuItem.js");
  const { generateToken } = await import("../utils/generateToken.js");

  const token = (user) => generateToken(user, null, false, { skipCookie: true });
  const call = async (method, p, auth, body) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const makeRestaurant = async (tag) => {
    const owner = await User.create({ name: `O${tag}`, email: `o${tag}@rev.test`, password: "x", role: "seller" });
    const restaurant = await Restaurant.create({
      ownerId: owner._id, name: `R${tag}`, email: `r${tag}@rev.test`, phone: "0622222222", cuisineType: "pizza", description: "t",
      profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true,
    });
    return { owner, restaurant, token: token(owner) };
  };
  const a = await makeRestaurant("a");
  const b = await makeRestaurant("b");

  let n = 0;
  const customers = [];
  for (const name of ["Marko Petrović", "Ana", "Jovan Ilić"]) {
    const user = await User.create({ name, email: `c${++n}@rev.test`, password: "x", role: "customer", phoneNumber: "0600000000" });
    customers.push({ user, token: token(user) });
  }
  const delivered = (customerId, restaurantId) =>
    Order.create({
      orderNumber: `REV-${++n}`, customer: customerId, restaurant: restaurantId, status: "delivered", deliveredAt: new Date(),
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 1200, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: 1200, deliveryFee: 250, serviceFee: 150, total: 1600, paymentMethod: "cash", currency: "RSD",
    });

  console.log("\ntags with a rating");
  const o1 = await delivered(customers[0].user._id, a.restaurant._id);
  let r = await call("PATCH", `/api/orders/${o1._id}/rate`, customers[0].token, {
    restaurantRating: 5, restaurantReview: "Odlično", restaurantTags: ["well_packed", "tasty", "arrived_cold", "nonsense", "tasty"],
  });
  ok("a rating with tags is accepted", r.status === 200, `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
  let stored = await Order.findById(o1._id).lean();
  ok("only tags matching the stars are kept, deduplicated, in catalog order",
    JSON.stringify(stored.customerRating?.restaurantTags) === JSON.stringify(["tasty", "well_packed"]),
    JSON.stringify(stored.customerRating?.restaurantTags));

  const o2 = await delivered(customers[1].user._id, a.restaurant._id);
  await call("PATCH", `/api/orders/${o2._id}/rate`, customers[1].token, { restaurantRating: 2, restaurantTags: ["arrived_cold", "tasty"] });
  stored = await Order.findById(o2._id).lean();
  ok("a low rating keeps only negative tags", JSON.stringify(stored.customerRating?.restaurantTags) === JSON.stringify(["arrived_cold"]));

  const o3 = await delivered(customers[2].user._id, a.restaurant._id);
  await call("PATCH", `/api/orders/${o3._id}/rate`, customers[2].token, { restaurantRating: 4, restaurantReview: "Dobro", restaurantTags: ["tasty"] });
  const o4 = await delivered(customers[2].user._id, a.restaurant._id);
  await call("PATCH", `/api/orders/${o4._id}/rate`, customers[2].token, { restaurantRating: 5 });
  stored = await Order.findById(o4._id).lean();
  ok("a rating without tags stores none", stored.customerRating?.restaurantTags === undefined);
  await delivered(customers[0].user._id, a.restaurant._id);

  console.log("\nthe public list");
  r = await call("GET", `/api/restaurants/${a.restaurant._id}/reviews?limit=2`);
  const data = r.body?.data;
  ok("anyone can read a restaurant's reviews", r.status === 200, String(r.status));
  ok("newest first, paginated", data?.reviews?.length === 2 && data.reviews[0].id === String(o4._id) &&
    data.pagination?.total === 4 && data.pagination?.hasNext === true, JSON.stringify(data?.pagination));
  ok("unrated orders are not listed", data?.pagination?.total === 4);
  ok("the summary has the star distribution",
    JSON.stringify(data?.summary?.distribution) === JSON.stringify({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 }), JSON.stringify(data?.summary?.distribution));
  ok("and the most mentioned tags", data?.summary?.topTags?.[0]?.tag === "tasty" && data.summary.topTags[0].count === 2,
    JSON.stringify(data?.summary?.topTags));
  ok("the average comes from the restaurant", data?.summary?.average === 4 && data.summary.count === 4,
    `${data?.summary?.average} ${data?.summary?.count}`);
  ok("authors are shown as first name and initial", data?.reviews?.[1]?.author === "Jovan I.", data?.reviews?.[1]?.author);
  ok("no order numbers on the public list", data?.reviews?.every((x) => x.orderNumber === undefined));
  r = await call("GET", `/api/restaurants/${a.restaurant._id}/reviews?page=2&limit=2`);
  ok("later pages carry no summary", r.body?.data?.summary === undefined && r.body?.data?.reviews?.length === 2);
  r = await call("GET", `/api/restaurants/${a.restaurant._id}/reviews?rating=2`);
  ok("filters by stars", r.body?.data?.reviews?.length === 1 && r.body.data.reviews[0].id === String(o2._id));
  r = await call("GET", `/api/restaurants/${new mongoose.Types.ObjectId()}/reviews`);
  ok("an unknown restaurant is a 404", r.status === 404, String(r.status));

  console.log("\nthe seller's list");
  r = await call("GET", "/api/restaurant/reviews?withText=true", a.token);
  ok("the seller sees reviews with order numbers", r.status === 200 && r.body?.data?.reviews?.length === 2 &&
    r.body.data.reviews.every((x) => x.orderNumber?.startsWith("REV-")), JSON.stringify(r.body).slice(0, 160));
  r = await call("GET", "/api/restaurant/reviews", customers[0].token);
  ok("customers cannot use it", r.status === 403, String(r.status));
  r = await call("GET", "/api/restaurant/reviews", b.token);
  ok("another seller sees only their own (none)", r.body?.data?.reviews?.length === 0);

  console.log("\nreplies");
  r = await call("PUT", `/api/restaurant/reviews/${o2._id}/reply`, a.token, { text: "   " });
  ok("an empty reply is refused", r.status === 400 && r.body?.code === "REVIEW_REPLY_INVALID", `${r.status} ${r.body?.code}`);
  r = await call("PUT", `/api/restaurant/reviews/${o2._id}/reply`, a.token, { text: "x".repeat(501) });
  ok("an over-long reply is refused", r.body?.code === "REVIEW_REPLY_INVALID");
  r = await call("PUT", `/api/restaurant/reviews/${o2._id}/reply`, b.token, { text: "Not mine" });
  ok("another restaurant's review is a 404", r.status === 404 && r.body?.code === "REVIEW_NOT_FOUND", `${r.status} ${r.body?.code}`);
  const unrated = await delivered(customers[0].user._id, a.restaurant._id);
  r = await call("PUT", `/api/restaurant/reviews/${unrated._id}/reply`, a.token, { text: "Hi" });
  ok("an unrated order cannot be replied to", r.status === 404);
  r = await call("PUT", `/api/restaurant/reviews/${o2._id}/reply`, customers[1].token, { text: "Hi" });
  ok("customers cannot reply", r.status === 403);

  r = await call("PUT", `/api/restaurant/reviews/${o2._id}/reply`, a.token, { text: "  Sorry, we will do better.  " });
  const first = r.body?.data?.review?.reply;
  ok("the seller replies", r.status === 200 && first?.text === "Sorry, we will do better." && first.repliedAt && !first.editedAt,
    JSON.stringify(r.body).slice(0, 160));
  r = await call("GET", `/api/restaurants/${a.restaurant._id}/reviews?rating=2`);
  ok("the reply is public", r.body?.data?.reviews?.[0]?.reply?.text === "Sorry, we will do better.");
  r = await call("GET", "/api/restaurant/reviews?unreplied=true", a.token);
  ok("the unanswered filter leaves it out", r.body?.data?.pagination?.total === 3 &&
    !r.body.data.reviews.some((x) => x.id === String(o2._id)), JSON.stringify(r.body?.data?.pagination));

  r = await call("PUT", `/api/restaurant/reviews/${o2._id}/reply`, a.token, { text: "Sorry, a new courier is on it." });
  const edited = r.body?.data?.review?.reply;
  ok("an edit keeps the first reply time and marks it edited",
    edited?.text === "Sorry, a new courier is on it." && edited.repliedAt === first?.repliedAt && Boolean(edited.editedAt));

  r = await call("DELETE", `/api/restaurant/reviews/${o2._id}/reply`, a.token);
  ok("the seller deletes the reply", r.status === 200 && r.body?.data?.review?.reply === null);
  stored = await Order.findById(o2._id).lean();
  ok("and it is gone from the order", !stored.customerRating?.restaurantReply?.text && stored.customerRating?.restaurantRating === 2);
  r = await call("DELETE", `/api/restaurant/reviews/${o2._id}/reply`, b.token);
  ok("another seller cannot delete it", r.status === 404);
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
