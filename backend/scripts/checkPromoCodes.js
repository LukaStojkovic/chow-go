// Promo codes and vouchers: the discount charged matches the shared preview,
// every limit holds under concurrency, a cancelled order gives its use back,
// and only the right people can see or change a code.
//
//   node scripts/checkPromoCodes.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes, randomUUID } from "crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import path from "path";
import { computePromoDiscount } from "@chowgo/shared/promoCode";
import { pricingFor } from "@chowgo/shared/adapters/pricing";

const PORT = 8600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const stamp = Date.now();

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const JWT_SECRET = randomBytes(48).toString("base64url");
const repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = repl.getUri();

const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: {
    ...process.env,
    MONGODB_URL: uri,
    PORT: String(PORT),
    JWT_SECRET,
    NODE_ENV: "development",
    LOG_LEVEL: "silent",
    MAIL_DISABLED: "true",
    REDIS_URL: "",
    MIN_ORDER_SUBTOTAL: "0",
  },
  stdio: ["ignore", process.env.DEBUG_CHILD ? "inherit" : "ignore", "inherit"],
});

const tokenFor = (user) => jwt.sign({ userId: String(user._id), typ: "access", ver: 0 }, JWT_SECRET, { expiresIn: "1h" });

async function call(token, method, p, body, headers = {}) {
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

const brief = (r) => `${r.status} ${r.body?.code ?? ""} ${(r.body?.message ?? "").slice(0, 80)}`;

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
  const { default: PromoCode } = await import("../models/PromoCode.js");
  const { default: PromoRedemption } = await import("../models/PromoRedemption.js");
  const { default: AuditLog } = await import("../models/AuditLog.js");
  await Promise.all([Order.init(), PromoCode.init(), PromoRedemption.init(), Cart.init()]);

  const fees = pricingFor("RSD");

  const makeRestaurant = async (tag) => {
    const owner = await User.create({ name: `O${tag}`, email: `o${tag}-${stamp}@promo.test`, password: "x", role: "seller" });
    const restaurant = await Restaurant.create({
      ownerId: owner._id, name: `R${tag}`, email: `r${tag}-${stamp}@promo.test`, phone: "0622222222",
      cuisineType: "pizza", description: "t",
      profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] },
      isActive: true, isOpenNow: true,
    });
    const item = await MenuItem.create({
      restaurant: restaurant._id, owner: owner._id, name: "Pizza", description: "d", price: 1000,
      category: "pizza", available: true,
      imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
    });
    return { owner, restaurant, item, token: tokenFor(owner) };
  };

  const makeCustomer = async (tag) => {
    const user = await User.create({
      name: `C${tag}`, email: `c${tag}-${stamp}@promo.test`, password: "x", role: "customer", phoneNumber: "0600000000",
    });
    const token = tokenFor(user);
    const addr = await call(token, "POST", "/api/delivery-address", {
      address: "Knez Mihailova 10", label: "Home", type: "apartment", location: { lat: 44.81, lng: 20.46 },
    });
    const addressId = addr.body?.address?._id ?? addr.body?.data?.address?._id ?? addr.body?.data?._id;
    return { user, token, addressId };
  };

  const A = await makeRestaurant("a");
  const B = await makeRestaurant("b");
  const admin = await User.create({
    name: "Admin", email: `admin-${stamp}@promo.test`, password: "x", role: "customer", isAdmin: true, phoneNumber: "0600000009",
  });
  const adminToken = tokenFor(admin);
  const alice = await makeCustomer("alice");
  const bob = await makeCustomer("bob");
  ok("customers have addresses", Boolean(alice.addressId && bob.addressId));

  const stock = (who, shop, quantity = 2) =>
    call(who.token, "POST", "/api/cart/items", {
      restaurantId: String(shop.restaurant._id), menuItemId: String(shop.item._id), quantity,
    });
  const place = (who, shop, promoCode, key = randomUUID()) =>
    call(who.token, "POST", "/api/orders/create", {
      restaurantId: String(shop.restaurant._id),
      deliveryAddressId: String(who.addressId),
      paymentMethod: "cash",
      deliveryType: "standard",
      tip: 0,
      ...(promoCode ? { promoCode } : {}),
    }, { "Idempotency-Key": key });
  const validate = (who, shop, code) =>
    call(who.token, "POST", "/api/promo/validate", { code, restaurantId: String(shop.restaurant._id) });
  const seedCart = async (who, shop) => {
    await Cart.deleteMany({ user: who.user._id, restaurant: shop.restaurant._id });
    await Cart.create({
      user: who.user._id,
      restaurant: shop.restaurant._id,
      items: [{ menuItem: shop.item._id, name: "Pizza", price: 1000, quantity: 2 }],
    });
  };
  const countOf = async (code) => (await PromoCode.findOne({ code }).lean())?.redemptionCount;

  console.log("\nsellers create codes for their own restaurant");
  const sellerCreate = await call(A.token, "POST", "/api/restaurant/promo-codes", {
    code: "welcome20", label: "20% off", type: "percentage", value: 20, maxDiscount: 300,
  });
  ok("a seller creates a percentage code", sellerCreate.status === 201, brief(sellerCreate));
  ok("stored uppercase, in the restaurant's currency", sellerCreate.body?.data?.code === "WELCOME20" && sellerCreate.body?.data?.currency === "RSD");
  const welcomeId = sellerCreate.body?.data?._id;
  const freeBySeller = await call(A.token, "POST", "/api/restaurant/promo-codes", { code: "FREESHIP", type: "free_delivery" });
  ok("a seller cannot create free delivery", freeBySeller.status === 400 && freeBySeller.body.code === "PROMO_TYPE_INVALID", brief(freeBySeller));
  const taken = await call(B.token, "POST", "/api/restaurant/promo-codes", { code: "Welcome20", type: "fixed", value: 100 });
  ok("codes are unique across the platform", taken.status === 409 && taken.body.code === "PROMO_CODE_TAKEN", brief(taken));
  const tooMuch = await call(A.token, "POST", "/api/restaurant/promo-codes", { code: "HALFPRICEPLUS", type: "percentage", value: 95 });
  ok("over 90% off is refused", tooMuch.status === 400, brief(tooMuch));
  const badCode = await call(A.token, "POST", "/api/restaurant/promo-codes", { code: "no spaces!", type: "fixed", value: 100 });
  ok("a malformed code is refused", badCode.status === 400 && badCode.body.code === "PROMO_CODE_INVALID", brief(badCode));
  const notCustomer = await call(alice.token, "POST", "/api/restaurant/promo-codes", { code: "ALICECODE", type: "fixed", value: 100 });
  ok("a customer cannot create codes", notCustomer.status === 403, brief(notCustomer));
  const otherSeller = await call(B.token, "PATCH", `/api/restaurant/promo-codes/${welcomeId}`, { label: "mine now" });
  ok("another seller cannot touch it", otherSeller.status === 404, brief(otherSeller));

  console.log("\nthe charged discount is the previewed one");
  await stock(alice, A);
  const preview = await validate(alice, A, "welcome20");
  const expected = computePromoDiscount({ promo: { type: "percentage", value: 20, maxDiscount: 300 }, subtotal: 2000 });
  ok("validate previews the capped discount", preview.status === 200 && preview.body?.data?.discount === expected && expected === 300, brief(preview) + JSON.stringify(preview.body?.data));
  const key = randomUUID();
  const placed = await place(alice, A, "welcome20", key);
  const order = placed.body?.data?.order;
  ok("the order is placed", placed.status === 201, brief(placed));
  ok("with the discount and a matching total",
    order?.discount === 300 && order?.total === 2000 + fees.deliveryFee + fees.serviceFee - 300,
    `${order?.discount} ${order?.total}`);
  ok("and a snapshot of who pays for it", order?.promo?.code === "WELCOME20" && order?.promo?.fundedBy === "restaurant");
  ok("one use is recorded", (await countOf("WELCOME20")) === 1);
  const replay = await place(alice, A, "welcome20", key);
  ok("an idempotent replay does not redeem twice", replay.body?.idempotentReplay === true && (await countOf("WELCOME20")) === 1, brief(replay));

  console.log("\nper-customer limits and giving a use back");
  await stock(alice, A);
  const again = await validate(alice, A, "WELCOME20");
  ok("a second use is refused", again.status === 409 && again.body.code === "PROMO_ALREADY_USED", brief(again));
  const againPlace = await place(alice, A, "WELCOME20");
  ok("and checkout refuses it too", againPlace.status === 409 && againPlace.body.code === "PROMO_ALREADY_USED", brief(againPlace));
  const cancel = await call(alice.token, "PATCH", `/api/orders/${order._id}/cancel`, { reason: "changed my mind" });
  ok("the customer cancels", cancel.status === 200, brief(cancel));
  ok("the use is given back", (await countOf("WELCOME20")) === 0);
  const afterCancel = await validate(alice, A, "WELCOME20");
  ok("and the code works again", afterCancel.status === 200, brief(afterCancel));
  const second = await place(alice, A, "WELCOME20");
  ok("placing again succeeds", second.status === 201, brief(second));
  const rejected = await call(A.token, "PATCH", `/api/restaurant/orders/${second.body?.data?.order?._id}/reject`, { reason: "busy" });
  ok("a seller rejection also gives it back", rejected.status === 200 && (await countOf("WELCOME20")) === 0, brief(rejected));

  console.log("\nlocked once used");
  await stock(alice, A);
  await place(alice, A, "WELCOME20");
  const relabel = await call(A.token, "PATCH", `/api/restaurant/promo-codes/${welcomeId}`, {
    label: "Spring deal", endsAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  ok("label and dates can still change", relabel.status === 200, brief(relabel));
  const revalue = await call(A.token, "PATCH", `/api/restaurant/promo-codes/${welcomeId}`, { value: 50 });
  ok("the discount cannot", revalue.status === 409 && revalue.body.code === "PROMO_LOCKED", brief(revalue));
  const partialPct = await call(A.token, "PATCH", `/api/restaurant/promo-codes/${welcomeId}`, { maxRedemptions: 0 });
  ok("a zero limit is refused", partialPct.status === 400, brief(partialPct));

  console.log("\nplatform codes, free delivery and currency");
  const free = await call(adminToken, "POST", "/api/admin/promo-codes", { code: "FREEDEL", type: "free_delivery", currency: "RSD" });
  ok("an admin creates free delivery", free.status === 201, brief(free));
  await stock(bob, B);
  const freePlaced = await place(bob, B, "freedel");
  ok("it waives exactly the delivery fee",
    freePlaced.body?.data?.order?.discount === fees.deliveryFee && freePlaced.body?.data?.order?.deliveryFee === fees.deliveryFee,
    brief(freePlaced));
  ok("paid by the platform", freePlaced.body?.data?.order?.promo?.fundedBy === "platform");
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "EUROONLY", type: "fixed", value: 2, currency: "EUR" });
  await stock(bob, B);
  const euro = await validate(bob, B, "EUROONLY");
  ok("a code in another currency is refused", euro.status === 400 && euro.body.code === "PROMO_CURRENCY_MISMATCH", brief(euro));
  const wrong = await validate(bob, B, "WELCOME20");
  ok("a restaurant's code is refused elsewhere", wrong.status === 400 && wrong.body.code === "PROMO_WRONG_RESTAURANT", brief(wrong));
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "ONLYATA", type: "fixed", value: 100, restaurants: [String(A.restaurant._id)] });
  const allow = await validate(bob, B, "ONLYATA");
  ok("a platform allowlist is honoured", allow.status === 400 && allow.body.code === "PROMO_WRONG_RESTAURANT", brief(allow));

  console.log("\nconditions");
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "BIGBASKET", type: "fixed", value: 500, minSubtotal: 5000 });
  const small = await validate(bob, B, "BIGBASKET");
  ok("below the minimum is refused", small.status === 400 && small.body.code === "PROMO_MIN_SUBTOTAL" && small.body.details?.minSubtotal === 5000, brief(small));
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "OLDDEAL", type: "fixed", value: 100, endsAt: new Date(Date.now() - 1000).toISOString() });
  ok("expired", (await validate(bob, B, "OLDDEAL")).body.code === "PROMO_EXPIRED");
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "SOONDEAL", type: "fixed", value: 100, startsAt: new Date(Date.now() + 86_400_000).toISOString() });
  ok("not started", (await validate(bob, B, "SOONDEAL")).body.code === "PROMO_NOT_STARTED");
  const big = await call(adminToken, "POST", "/api/admin/promo-codes", { code: "BIGFIXED", type: "fixed", value: 999999 });
  const capped = await validate(bob, B, "BIGFIXED");
  ok("a fixed discount never exceeds the subtotal", capped.body?.data?.discount === 2000, brief(capped) + brief(big));
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "FIRSTONE", type: "fixed", value: 100, firstOrderOnly: true });
  ok("first order only refuses a returning customer", (await validate(bob, B, "FIRSTONE")).body.code === "PROMO_FIRST_ORDER_ONLY");
  const carol = await makeCustomer("carol");
  await stock(carol, B);
  ok("and accepts a new one", (await validate(carol, B, "FIRSTONE")).status === 200);
  const paused = await call(adminToken, "POST", "/api/admin/promo-codes", { code: "PAUSEME", type: "fixed", value: 100 });
  await call(adminToken, "POST", `/api/admin/promo-codes/${paused.body?.data?._id}/status`, { action: "pause" });
  ok("a paused code is refused", (await validate(carol, B, "PAUSEME")).body.code === "PROMO_INACTIVE");
  ok("an unknown code is not found", (await validate(carol, B, "NOPE-NOPE")).body.code === "PROMO_NOT_FOUND");

  console.log("\nlimits hold under concurrency");
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "ONCEEVER", type: "fixed", value: 100, maxRedemptions: 1, perCustomerLimit: 1 });
  await Promise.all([seedCart(alice, B), seedCart(carol, B)]);
  const race = await Promise.all([place(alice, B, "ONCEEVER"), place(carol, B, "ONCEEVER")]);
  ok("two customers racing for the last use: exactly one wins",
    race.filter((r) => r.status === 201).length === 1 && (await countOf("ONCEEVER")) === 1,
    race.map(brief).join(" | "));
  ok("the loser is told it is used up", race.some((r) => r.body.code === "PROMO_EXHAUSTED"), race.map(brief).join(" | "));
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "ONEEACH", type: "fixed", value: 100 });
  const dave = await makeCustomer("dave");
  await Promise.all([seedCart(dave, A), seedCart(dave, B)]);
  const self = await Promise.all([place(dave, A, "ONEEACH"), place(dave, B, "ONEEACH")]);
  ok("one customer using it twice at once: exactly one wins",
    self.filter((r) => r.status === 201).length === 1 && (await PromoRedemption.countDocuments({ customer: dave.user._id, status: "redeemed" })) === 1,
    self.map(brief).join(" | "));
  await Cart.deleteMany({ user: { $in: [alice.user._id, carol.user._id, dave.user._id] } });

  console.log("\nconfirming keeps the use");
  await call(adminToken, "POST", "/api/admin/promo-codes", { code: "KEEPIT", type: "fixed", value: 100 });
  await seedCart(carol, A);
  const kept = await place(carol, A, "KEEPIT");
  const confirmed = await call(A.token, "PATCH", `/api/restaurant/orders/${kept.body?.data?.order?._id}/confirm`, {});
  ok("a confirmed order still holds its redemption", confirmed.status === 200 && (await countOf("KEEPIT")) === 1, brief(confirmed));
  const support = await call(adminToken, "POST", `/api/admin/orders/${kept.body?.data?.order?._id}/cancel`, { reason: "test" });
  ok("an admin cancel gives it back", support.status === 200 && (await countOf("KEEPIT")) === 0, brief(support));

  console.log("\npersonal vouchers");
  const source = await Order.findOne({ customer: bob.user._id }).lean();
  const noReason = await call(adminToken, "POST", `/api/admin/orders/${source._id}/voucher`, { type: "fixed", value: 400 });
  ok("issuing needs a reason", noReason.status === 400 && noReason.body.code === "REASON_REQUIRED", brief(noReason));
  const issued = await call(adminToken, "POST", `/api/admin/orders/${source._id}/voucher`, { type: "fixed", value: 400, reason: "late delivery" });
  const voucher = issued.body?.data;
  ok("an admin issues a voucher for an order", issued.status === 201 && /^GIFT-[A-Z0-9]{10}$/.test(voucher?.code ?? ""), brief(issued));
  ok("assigned to that order's customer", String(voucher?.assignedTo) === String(bob.user._id));
  const mine = await call(bob.token, "GET", "/api/promo/mine");
  ok("the customer sees it in their vouchers", mine.body?.data?.vouchers?.some((v) => v.code === voucher?.code), brief(mine));
  await stock(carol, B);
  const stolen = await validate(carol, B, voucher?.code);
  ok("someone else's voucher reads as not found", stolen.status === 404 && stolen.body.code === "PROMO_NOT_FOUND", brief(stolen));
  await stock(bob, B);
  const used = await place(bob, B, voucher?.code);
  ok("the owner can use it", used.status === 201 && used.body?.data?.order?.discount === 400, brief(used));
  const mineAfter = await call(bob.token, "GET", "/api/promo/mine");
  ok("and it leaves the list once used", !mineAfter.body?.data?.vouchers?.some((v) => v.code === voucher?.code));

  console.log("\nadmin oversight");
  const noReasonPause = await call(adminToken, "POST", `/api/admin/promo-codes/${welcomeId}/status`, { action: "pause" });
  ok("pausing a seller's code needs a reason", noReasonPause.status === 400, brief(noReasonPause));
  const adminPause = await call(adminToken, "POST", `/api/admin/promo-codes/${welcomeId}/status`, { action: "pause", reason: "abuse" });
  ok("an admin can pause it", adminPause.status === 200 && adminPause.body?.data?.status === "paused", brief(adminPause));
  const twice = await call(adminToken, "POST", `/api/admin/promo-codes/${welcomeId}/status`, { action: "pause", reason: "again" });
  ok("pausing twice is a conflict", twice.status === 409, brief(twice));
  const audits = await AuditLog.countDocuments({ targetType: "promo" });
  ok("admin actions are audited", audits >= 10, String(audits));
  ok("non-admins get a 404", (await call(alice.token, "GET", "/api/admin/promo-codes")).status === 404);
  const stats = await call(A.token, "GET", `/api/restaurant/promo-codes/${welcomeId}/stats`);
  ok("sellers get usage stats", stats.status === 200 && typeof stats.body?.data?.stats?.orders === "number", brief(stats));

  console.log("\nguessing is rate limited");
  const eve = await makeCustomer("eve");
  await stock(eve, A);
  let last;
  for (let i = 0; i < 11; i++) last = await validate(eve, A, `GUESS-${i}${i}${i}`);
  ok("the eleventh miss is a 429", last.status === 429, brief(last));

  await mongoose.disconnect();
  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  child.kill();
  await repl.stop();
}
