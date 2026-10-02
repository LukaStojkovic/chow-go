// Stuck orders recover on their own, and support can end any unfinished order.
// Runs the recovery jobs with an explicit "now" against a throwaway database.
//
//   node scripts/checkOrderRecovery.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: Courier } = await import("../models/Courier.js");
  const { default: Order } = await import("../models/Order.js");
  await import("../models/MenuItem.js");
  const recovery = await import("../services/orderRecovery.service.js");

  const owner = await User.create({ name: "O", email: "o@recover.test", password: "x", role: "seller" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@recover.test", phone: "0622222222", cuisineType: "pizza",
    description: "d", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000" }, location: { type: "Point", coordinates: [20.45, 44.8] },
  });
  const courierUser = await User.create({ name: "K", email: "k@recover.test", password: "x", role: "courier", phoneNumber: "0611111111" });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "K", phoneNumber: "0611111111", email: "k@recover.test",
    vehicleType: "bike", verificationStatus: "verified", isAvailable: false,
  });

  const now = new Date();
  const ago = (minutes) => new Date(now.getTime() - minutes * 60 * 1000);
  let n = 0;
  async function order(fields) {
    const { insertedId } = await Order.collection.insertOne({
      orderNumber: `ORD-REC-${n++}`, customer: new mongoose.Types.ObjectId(), restaurant: restaurant._id,
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 9, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: 9, deliveryFee: 2.5, serviceFee: 0, priorityFee: 0, tax: 0, tip: 0, discount: 0, total: 11.5,
      paymentMethod: "cash", paymentStatus: "pending", createdAt: now, updatedAt: now, ...fields,
    });
    return insertedId;
  }
  const statusOf = async (id) => (await Order.findById(id).lean()).status;

  console.log("\nunanswered pending orders are rejected");
  const ignored = await order({ status: "pending", createdAt: ago(20) });
  const fresh = await order({ status: "pending", createdAt: ago(5) });
  ok("one stale order is rejected", (await recovery.rejectStalePendingOrders(now)) === 1);
  const rejected = await Order.findById(ignored).lean();
  ok("with a reason the customer can read", rejected.status === "rejected" && rejected.rejectionReason === recovery.AUTO_REJECT_REASON);
  ok("a five-minute-old order is left alone", (await statusOf(fresh)) === "pending");
  ok("running again changes nothing", (await recovery.rejectStalePendingOrders(now)) === 0);

  console.log("\nassignments nobody picks up go back to the pool");
  const held = await order({ status: "assigned", courier: courier._id, assignedAt: ago(30) });
  await Courier.updateOne({ _id: courier._id }, { $set: { currentOrder: held, isAvailable: false } });
  const recent = await order({ status: "assigned", courier: new mongoose.Types.ObjectId(), assignedAt: ago(5) });
  ok("one stale assignment is released", (await recovery.releaseStaleAssignments(now)) === 1);
  const back = await Order.findById(held).lean();
  ok("the order is ready again with no courier", back.status === "ready" && back.courier === null);
  const freed = await Courier.findById(courier._id).lean();
  ok("the courier is free", freed.currentOrder === null && freed.isAvailable === true);
  ok("a five-minute-old assignment is left alone", (await statusOf(recent)) === "assigned");

  console.log("\nlong deliveries are reported");
  const longRun = await order({ status: "in_transit", courier: courier._id, pickedUpAt: ago(180) });
  await order({ status: "picked_up", courier: new mongoose.Types.ObjectId(), pickedUpAt: ago(10) });
  ok("only the three-hour delivery is flagged", (await recovery.reportStuckDeliveries(now)) === 1);

  console.log("\nsupport can cancel any unfinished order");
  await Courier.updateOne({ _id: courier._id }, { $set: { currentOrder: longRun, isAvailable: false } });
  const cancelled = await recovery.forceCancelOrder(longRun, "courier unreachable");
  ok("an in-transit order is cancelled", cancelled.status === "cancelled" && cancelled.cancelledBy === "admin");
  ok("with the reason recorded", cancelled.cancellationReason.includes("courier unreachable"));
  const released = await Courier.findById(courier._id).lean();
  ok("and its courier is freed", released.currentOrder === null && released.isAvailable === true);
  const refuse = async (id) => {
    try {
      await recovery.forceCancelOrder(id, "again");
      return null;
    } catch (error) {
      return error.statusCode;
    }
  };
  ok("a finished order is a 409", (await refuse(longRun)) === 409);
  ok("an unknown order is a 404", (await refuse(new mongoose.Types.ObjectId())) === 404);

  console.log("\nbackground location reports over HTTP");
  const { reportCourierLocationOperation } = await import("../services/courierOrder.service.js");
  const report = async (fields) => {
    try {
      return await reportCourierLocationOperation({ courierUserId: courierUser._id, ...fields });
    } catch (error) {
      return { status: error.statusCode };
    }
  };
  await Courier.updateOne({ _id: courier._id }, { $set: { currentOrder: null } });
  ok("with no active delivery it says stop tracking", (await report({ coordinates: [20.46, 44.81] })).tracking === false);
  const live = await order({ status: "in_transit", courier: courier._id, pickedUpAt: ago(5) });
  const { forgetCourierThrottle } = await import("../services/locationTracking.service.js");
  await forgetCourierThrottle(courier._id);
  const reported = await report({ coordinates: [20.4701, 44.8102], orderId: String(live) });
  ok("on an active delivery it keeps tracking", reported.tracking === true, JSON.stringify(reported));
  const stored = (await Courier.findById(courier._id).lean()).currentLocation?.coordinates;
  ok("and stores the position", stored?.[0] === 20.4701 && stored?.[1] === 44.8102, JSON.stringify(stored));
  ok("someone else's order does not count", (await report({ coordinates: [20.47, 44.81], orderId: String(await order({ status: "in_transit", courier: new mongoose.Types.ObjectId() })) })).tracking === false);
  ok("bad coordinates are a 400", (await report({ coordinates: [0, 0] })).status === 400);

  console.log("\nthe operator endpoint is locked");
  const { opsAccess } = await import("../middlewares/authMiddleware.js");
  const gate = (headers) => new Promise((resolve) => opsAccess({ headers }, {}, (err) => resolve(err ?? null)));
  delete process.env.OPS_TOKEN;
  ok("without OPS_TOKEN it does not exist", (await gate({ "x-ops-token": "anything" }))?.statusCode === 404);
  process.env.OPS_TOKEN = "short";
  ok("a short OPS_TOKEN is refused outright", (await gate({ "x-ops-token": "short" }))?.statusCode === 404);
  process.env.OPS_TOKEN = "o".repeat(40);
  ok("a wrong token is a 404", (await gate({ "x-ops-token": "x".repeat(40) }))?.statusCode === 404);
  ok("the right token is let through", (await gate({ "x-ops-token": "o".repeat(40) })) === null);
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
