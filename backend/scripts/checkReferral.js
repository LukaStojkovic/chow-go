// The referral programme end to end: a customer's code, a friend applying it
// for a first-order voucher, every way applying is refused, the referrer's
// reward on the friend's first delivery (once, and within the monthly cap),
// and the data export.
//
//   node scripts/checkReferral.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 10100 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const DAY = 24 * 60 * 60 * 1000;

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
  const { default: Courier } = await import("../models/Courier.js");
  const { default: Order } = await import("../models/Order.js");
  const { default: PromoCode } = await import("../models/PromoCode.js");
  const { default: Referral } = await import("../models/Referral.js");
  await import("../models/MenuItem.js");
  const { generateToken } = await import("../utils/generateToken.js");
  const courierOrders = await import("../services/courierOrder.service.js");
  const referrals = await import("../services/referral.service.js");
  const { exportAccountData } = await import("../services/accountExport.service.js");

  let n = 0;
  const customer = async () => {
    const user = await User.create({ name: `C${++n}`, email: `c${n}@ref.test`, password: "x", role: "customer", phoneNumber: "0600000000" });
    return { user, token: generateToken(user, null, false, { skipCookie: true }) };
  };
  const call = async (method, p, token, body) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", Authorization: `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const owner = await User.create({ name: "O", email: "o@ref.test", password: "x", role: "seller" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@ref.test", phone: "0622222222", cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true,
  });
  const courierUser = await User.create({ name: "K", email: "k@ref.test", password: "x", role: "courier" });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "K", phoneNumber: "0600000003", email: "k@ref.test", vehicleType: "bike",
    vehicleNumber: "BG-1", vehicleModel: "V", profilePicture: "https://example.test/k.jpg", verificationStatus: "verified",
  });
  const sellerToken = generateToken(owner, null, false, { skipCookie: true });

  let orderNo = 0;
  const placeOrder = (customerId, status = "pending") =>
    Order.create({
      orderNumber: `REF-${++orderNo}`, customer: customerId, restaurant: restaurant._id, status,
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 1200, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: 1200, deliveryFee: 250, serviceFee: 150, total: 1600, paymentMethod: "cash", currency: "RSD",
    });
  const deliver = async (order) => {
    await Order.updateOne({ _id: order._id }, { $set: { status: "in_transit", courier: courier._id } });
    await Courier.updateOne({ _id: courier._id }, { $set: { currentOrder: order._id, isAvailable: false } });
    await courierOrders.markDeliveredOperation({ orderId: order._id, courierUserId: courierUser._id });
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 50));
  };

  const alice = await customer();
  const bob = await customer();

  console.log("\na customer's own code");
  let r = await call("GET", "/api/referrals/me", alice.token);
  const code = r.body?.data?.code;
  ok("a customer gets an 8-character code", r.status === 200 && /^[A-HJ-NP-Z2-9]{8}$/.test(code ?? ""), JSON.stringify(r.body).slice(0, 120));
  ok("with the programme's amounts", r.body?.data?.rewards?.friend === 300 && r.body?.data?.rewards?.minSubtotal === 1000);
  r = await call("GET", "/api/referrals/me", alice.token);
  ok("and the same code every time", r.body?.data?.code === code);
  ok("a new customer may still apply a code", r.body?.data?.canApplyCode === true);
  r = await call("GET", "/api/referrals/me", sellerToken);
  ok("sellers are not part of it", r.status === 403, String(r.status));

  console.log("\napplying a friend's code");
  r = await call("POST", "/api/referrals/apply", bob.token, { code: code.toLowerCase().replace(/(.{4})/, "$1-") });
  ok("a friend's code is accepted however it is typed", r.status === 201, `${r.status} ${r.body?.code}`);
  const welcome = await PromoCode.findOne({ assignedTo: bob.user._id }).lean();
  ok("and gives a 300 RSD first-order voucher for orders of 1000 or more",
    welcome?.type === "fixed" && welcome.value === 300 && welcome.currency === "RSD" && welcome.minSubtotal === 1000 &&
      welcome.firstOrderOnly === true && welcome.maxRedemptions === 1 && welcome.code === r.body?.data?.voucherCode);
  ok("valid for 30 days", Math.abs(new Date(welcome?.endsAt).getTime() - (Date.now() + 30 * DAY)) < 60_000);

  r = await call("POST", "/api/referrals/apply", bob.token, { code });
  ok("a second code is refused", r.status === 409 && r.body?.code === "REFERRAL_ALREADY_APPLIED", r.body?.code);
  r = await call("POST", "/api/referrals/apply", alice.token, { code });
  ok("your own code is refused", r.body?.code === "REFERRAL_OWN_CODE", r.body?.code);
  r = await call("POST", "/api/referrals/apply", alice.token, { code: "nope!" });
  ok("a malformed code is refused", r.body?.code === "REFERRAL_INVALID_CODE", r.body?.code);
  r = await call("POST", "/api/referrals/apply", alice.token, { code: "ZZZZZZZZ" });
  ok("a well-formed code nobody owns is refused", r.body?.code === "REFERRAL_INVALID_CODE", r.body?.code);

  const carol = await customer();
  await placeOrder(carol.user._id, "pending");
  r = await call("POST", "/api/referrals/apply", carol.token, { code });
  ok("a customer who has already ordered is refused", r.body?.code === "REFERRAL_NOT_NEW", r.body?.code);
  const dave = await customer();
  await placeOrder(dave.user._id, "cancelled");
  r = await call("POST", "/api/referrals/apply", dave.token, { code });
  ok("but a cancelled order does not count as ordering", r.status === 201, r.body?.code);

  r = await call("GET", "/api/referrals/me", bob.token);
  ok("the friend can no longer apply a code, and sees the one they used",
    r.body?.data?.canApplyCode === false && r.body?.data?.appliedCode === code);
  r = await call("GET", "/api/referrals/me", alice.token);
  ok("the referrer sees two invited, none rewarded yet", r.body?.data?.stats?.invited === 2 && r.body?.data?.stats?.rewarded === 0,
    JSON.stringify(r.body?.data?.stats));

  console.log("\nthe referrer's reward");
  const bobsFirst = await placeOrder(bob.user._id);
  await deliver(bobsFirst);
  const reward = await PromoCode.findOne({ assignedTo: alice.user._id }).lean();
  ok("the friend's first delivery gives the referrer a 300 RSD voucher",
    reward?.value === 300 && reward.currency === "RSD" && !reward.firstOrderOnly, JSON.stringify(reward ?? {}).slice(0, 100));
  ok("valid for 60 days", Math.abs(new Date(reward?.endsAt).getTime() - (Date.now() + 60 * DAY)) < 60_000);
  ok("the referral is marked rewarded", (await Referral.findOne({ referred: bob.user._id }).lean())?.status === "rewarded");

  const bobsSecond = await placeOrder(bob.user._id);
  await deliver(bobsSecond);
  ok("a later delivery pays nothing more", (await PromoCode.countDocuments({ assignedTo: alice.user._id })) === 1);
  await referrals.rewardReferrerForDelivery({ ...bobsFirst.toObject(), status: "delivered" });
  ok("calling the reward again for the same order pays nothing more", (await PromoCode.countDocuments({ assignedTo: alice.user._id })) === 1);

  console.log("\nthe monthly cap");
  const busy = await customer();
  const busyCode = (await call("GET", "/api/referrals/me", busy.token)).body.data.code;
  await Referral.insertMany(
    Array.from({ length: 20 }, () => ({
      referrer: busy.user._id, referred: new mongoose.Types.ObjectId(), code: busyCode, status: "rewarded", rewardedAt: new Date(),
    })),
  );
  const erin = await customer();
  await call("POST", "/api/referrals/apply", erin.token, { code: busyCode });
  await deliver(await placeOrder(erin.user._id));
  ok("after 20 rewards in 30 days the next one is capped, not paid",
    (await Referral.findOne({ referred: erin.user._id }).lean())?.status === "capped" &&
      (await PromoCode.countDocuments({ assignedTo: busy.user._id })) === 0);

  console.log("\nthe data export");
  const exported = await exportAccountData(bob.user._id);
  const text = JSON.stringify(exported);
  ok("lists the code the customer joined with", text.includes(code) && text.includes("joinedWith"));
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
