// The admin console's rules: only admins reach it, every change is legal only
// from the states it names and loses cleanly to a concurrent one, a suspension
// actually locks the person out, and every change leaves an audit row. Runs
// against a throwaway in-memory database.
//
//   node scripts/checkAdmin.js
import "../config/env.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const mongo = await MongoMemoryServer.create();
process.env.LOG_LEVEL = "silent";
await mongoose.connect(mongo.getUri());

const { default: User } = await import("../models/User.js");
const { default: Courier } = await import("../models/Courier.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
const { default: Order } = await import("../models/Order.js");
const { default: AuditLog } = await import("../models/AuditLog.js");
await import("../models/MenuItem.js");
const admin = await import("../services/admin.service.js");
const { isAdminMiddleware } = await import("../middlewares/roleMiddleware.js");
const { protectedRoute } = await import("../middlewares/authMiddleware.js");
const { login } = await import("../controllers/authController.js");
const { generateToken } = await import("../utils/generateToken.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};
const error = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
};
const runMiddleware = (mw, req) =>
  new Promise((resolve) => {
    const res = { status: () => res, json: () => res, cookie() {} };
    Promise.resolve(mw(req, res, (err) => resolve(err ?? null))).catch(resolve);
  });

try {
  await Promise.all([Restaurant.init(), Order.init(), User.init()]);
  const boss = await User.create({ name: "Boss", email: "boss@admin.test", password: "x", role: "customer", phoneNumber: "0600000000", isAdmin: true });
  const otherAdmin = await User.create({ name: "Two", email: "two@admin.test", password: "x", role: "customer", phoneNumber: "0600000009", isAdmin: true });
  const seller = await User.create({ name: "Seller", email: "seller@admin.test", password: await bcrypt.hash("sellerpass1", 4), role: "seller" });
  const courierUser = await User.create({ name: "Kurir", email: "kurir@admin.test", password: "x", role: "courier", phoneNumber: "0611111111" });
  const courier = await Courier.create({ userId: courierUser._id, fullName: "Kurir", phoneNumber: "0611111111", email: "kurir@admin.test", vehicleType: "bike", isAvailable: true });
  const base = {
    cuisineType: "pizza", description: "t", phone: "0622222222",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S 1", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  };
  const pending = await Restaurant.create({ ...base, ownerId: new mongoose.Types.ObjectId(), name: "Pending", email: "p@admin.test", isActive: false, approvalStatus: "pending" });
  const live = await Restaurant.create({ ...base, ownerId: seller._id, name: "Live", email: "l@admin.test", isActive: true });
  // A restaurant from before approval existed has no status at all.
  await Restaurant.collection.updateOne({ _id: live._id }, { $unset: { approvalStatus: 1 } });
  const ctx = { actor: boss, requestId: "req-1" };

  console.log("\naccess");
  ok("a non-admin gets a 404", (await runMiddleware(isAdminMiddleware, { user: seller }))?.statusCode === 404);
  ok("an admin passes", (await runMiddleware(isAdminMiddleware, { user: boss })) === null);

  console.log("\nrestaurants");
  ok("rejecting needs a reason", (await error(() => admin.setRestaurantStatus({ ...ctx, restaurantId: pending._id, action: "reject" })))?.code === "REASON_REQUIRED");
  const racers = await Promise.all([
    error(() => admin.setRestaurantStatus({ ...ctx, restaurantId: pending._id, action: "approve" })),
    error(() => admin.setRestaurantStatus({ ...ctx, restaurantId: pending._id, action: "approve" })),
  ]);
  ok("two admins approving at once: one wins, one gets 409", racers.filter((e) => e === null).length === 1 && racers.some((e) => e?.statusCode === 409));
  const approved = await Restaurant.findById(pending._id).lean();
  ok("approval puts it live", approved.isActive === true && approved.approvalStatus === "approved");
  ok("an unknown action is refused", (await error(() => admin.setRestaurantStatus({ ...ctx, restaurantId: live._id, action: "delete" })))?.statusCode === 400);
  await admin.setRestaurantStatus({ ...ctx, restaurantId: live._id, action: "suspend", reason: "health inspection failed" });
  const suspended = await Restaurant.findById(live._id).lean();
  ok("a legacy restaurant can be suspended", suspended.approvalStatus === "suspended" && suspended.isActive === false && suspended.isOpenNow === false);
  ok("approving a suspended one is refused (reinstate is the way back)", (await error(() => admin.setRestaurantStatus({ ...ctx, restaurantId: live._id, action: "approve" })))?.statusCode === 409);
  await admin.setRestaurantStatus({ ...ctx, restaurantId: live._id, action: "reinstate" });
  ok("reinstating puts it back", (await Restaurant.findById(live._id).lean()).isActive === true);
  const listed = await admin.listRestaurants({ status: "approved" });
  ok("the approved filter includes restaurants with no status", listed.items.length === 2, String(listed.items.length));

  console.log("\ncouriers");
  await admin.setCourierVerification({ ...ctx, courierId: courier._id, status: "verified" });
  ok("verifying works", (await Courier.findById(courier._id).lean()).verificationStatus === "verified");
  ok("verifying twice is a 409", (await error(() => admin.setCourierVerification({ ...ctx, courierId: courier._id, status: "verified" })))?.statusCode === 409);
  ok("rejecting needs a reason", (await error(() => admin.setCourierVerification({ ...ctx, courierId: courier._id, status: "rejected" })))?.code === "REASON_REQUIRED");

  console.log("\nsuspension");
  ok("an admin cannot suspend themselves", (await error(() => admin.suspendUser({ ...ctx, userId: boss._id, reason: "x" })))?.code === "SELF_ACTION");
  ok("nor another admin", (await error(() => admin.suspendUser({ ...ctx, userId: otherAdmin._id, reason: "x" })))?.statusCode === 409);
  const token = generateToken(seller, null, false, { skipCookie: true });
  ok("the seller's session works before", (await runMiddleware(protectedRoute, { headers: { authorization: `Bearer ${token}` }, cookies: {} })) === null);
  await admin.suspendUser({ ...ctx, userId: seller._id, reason: "fraudulent orders" });
  const afterToken = await runMiddleware(protectedRoute, { headers: { authorization: `Bearer ${token}` }, cookies: {} });
  ok("the old session is revoked", afterToken?.statusCode === 401, String(afterToken?.code));
  const fresh = generateToken(await User.findById(seller._id), null, false, { skipCookie: true });
  const freshResult = await runMiddleware(protectedRoute, { headers: { authorization: `Bearer ${fresh}` }, cookies: {} });
  ok("even a fresh token is refused", freshResult?.code === "ACCOUNT_SUSPENDED", String(freshResult?.code));
  const loginResult = await runMiddleware(login, { body: { email: "seller@admin.test", password: "sellerpass1" }, headers: {} });
  ok("the right password gets ACCOUNT_SUSPENDED", loginResult?.code === "ACCOUNT_SUSPENDED", String(loginResult?.code));
  const wrongPassword = await runMiddleware(login, { body: { email: "seller@admin.test", password: "wrongpass1" }, headers: {} });
  ok("a wrong password does not reveal the suspension", wrongPassword?.code === "INVALID_CREDENTIALS");
  ok("their restaurant goes offline with them", (await Restaurant.findById(live._id).lean()).isActive === false);
  await admin.suspendUser({ ...ctx, userId: courierUser._id, reason: "no-shows" });
  ok("a suspended courier is taken off duty", (await Courier.findById(courier._id).lean()).isAvailable === false);
  await admin.unsuspendUser({ ...ctx, userId: seller._id });
  ok("unsuspending lets them back in", !(await User.findById(seller._id).lean()).suspendedAt);
  ok("but leaves the restaurant for an admin to reinstate", (await Restaurant.findById(live._id).lean()).isActive === false);

  console.log("\norders");
  const order = await Order.create({
    customer: boss._id, restaurant: approved._id, status: "preparing",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 900, quantity: 1 }],
    deliveryAddress: new mongoose.Types.ObjectId(),
    deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
    subtotal: 900, deliveryFee: 250, serviceFee: 150, tax: 0, total: 1300, paymentMethod: "cash",
  });
  ok("cancelling needs a reason", (await error(() => admin.cancelOrder({ ...ctx, orderId: order._id })))?.code === "REASON_REQUIRED");
  await admin.cancelOrder({ ...ctx, orderId: order._id, reason: "restaurant closed early" });
  ok("an admin can cancel an order", (await Order.findById(order._id).lean()).cancelledBy === "admin");

  console.log("\naudit");
  const log = await AuditLog.find().sort({ createdAt: 1 }).lean();
  const actions = log.map((row) => row.action);
  ok("every change was logged", ["restaurant.approve", "restaurant.suspend", "restaurant.reinstate", "courier.verified", "user.suspend", "user.unsuspend", "order.cancel"].every((a) => actions.includes(a)), actions.join(","));
  ok("refused changes were not", actions.filter((a) => a === "restaurant.approve").length === 1);
  const suspension = log.find((row) => row.action === "user.suspend" && String(row.targetId) === String(seller._id));
  ok("rows name the admin, the reason and the request", suspension?.actorEmail === "boss@admin.test" && suspension.reason === "fraudulent orders" && suspension.requestId === "req-1");
  ok("and record side effects", suspension?.after?.restaurantSuspended === String(live._id));
  const page = await admin.listAudit({ targetType: "user", limit: 2 });
  ok("the log pages and filters", page.items.length === 2 && page.items.every((r) => r.targetType === "user") && page.pagination.total === 3, JSON.stringify(page.pagination));

  const overview = await admin.getOverview();
  ok("the overview counts what needs attention", overview.suspendedUsers === 1 && overview.pendingRestaurants === 0, JSON.stringify(overview));

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
