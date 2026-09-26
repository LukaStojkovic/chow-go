// The customer cancel path, against a throwaway in-memory database.
//
// The bug this pins down: cancelling an "assigned" order left the courier with
// isAvailable false and currentOrder set, so acceptOrderOperation refused them
// ("not on duty"), changeCourierDutyStatusOperation refused to put them back on
// ("active order"), and a cancelled order is not in COURIER_ACTIVE_STATUSES so
// they could not clear it by finishing. A closed deadlock with no admin tool.
//
//   node scripts/checkOrderCancel.js
import "../config/env.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());

const { default: Order } = await import("../models/Order.js");
const { default: User } = await import("../models/User.js");
const { default: Courier } = await import("../models/Courier.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
await import("../models/MenuItem.js");
const { canCustomerCancel } = await import("../utils/orderStatus.js");
const { acceptOrderOperation, changeCourierDutyStatusOperation } = await import(
  "../services/courierOrder.service.js"
);

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  await Promise.all([Order.init(), Restaurant.init(), Courier.init()]);

  const owner = await User.create({ name: "O", email: "o@cancel.test", password: "x", role: "seller" });
  const customer = await User.create({
    name: "C", email: "c@cancel.test", password: "x", role: "customer", phoneNumber: "0600000000",
  });
  const courierUser = await User.create({
    name: "R", email: "r@cancel.test", password: "x", role: "courier", phoneNumber: "0611111111",
  });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "R", phoneNumber: "0611111111",
    email: "r@cancel.test", vehicleType: "bike", verificationStatus: "verified",
  });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "rest@cancel.test", phone: "0622222222",
    cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });

  const makeOrder = (status) =>
    Order.create({
      customer: customer._id, restaurant: restaurant._id, status,
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 9.5, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: {
        fullAddress: "A 1", location: { type: "Point", coordinates: [20.46, 44.81] },
      },
      subtotal: 9.5, deliveryFee: 2.5, tax: 0, total: 13.5, paymentMethod: "cash",
    });

  console.log("\ncancel rule agrees with the client");
  const expected = {
    pending: true, confirmed: true, preparing: false, ready: true, assigned: true,
    picked_up: false, in_transit: false, delivered: false, cancelled: false, rejected: false,
  };
  for (const [status, allowed] of Object.entries(expected)) {
    ok(`${status} -> ${allowed ? "cancellable" : "blocked"}`, canCustomerCancel(status) === allowed);
  }

  console.log("\ncancelling an assigned order frees the courier");
  const order = await makeOrder("ready");
  const accepted = await acceptOrderOperation({ orderId: order._id, courierUserId: courierUser._id });
  ok("courier accepted the order", accepted?.status === "assigned", accepted?.status);

  let c = await Courier.findById(courier._id).lean();
  ok("courier is held while assigned", c.isAvailable === false && String(c.currentOrder) === String(order._id));

  // What the handler does, exercised directly.
  const { cancelOrder } = await import("../controllers/orderController.js");
  const req = { params: { orderId: String(order._id) }, body: { reason: "changed my mind" }, user: { _id: customer._id } };
  let handlerError = null;
  const res = { status: () => ({ json: () => {} }) };
  await cancelOrder(req, res, (err) => { handlerError = err; });
  ok("cancel succeeded", !handlerError, handlerError?.message);

  const cancelled = await Order.findById(order._id).lean();
  ok("order is cancelled", cancelled.status === "cancelled");
  ok("cancelledBy records the customer", cancelled.cancelledBy === "customer");

  c = await Courier.findById(courier._id).lean();
  ok("courier currentOrder was cleared", c.currentOrder === null, String(c.currentOrder));
  ok("courier is available again", c.isAvailable === true, String(c.isAvailable));

  const duty = await changeCourierDutyStatusOperation({ courierUserId: courierUser._id, isAvailable: true });
  ok("courier can go on duty", duty.isAvailable === true);

  const next = await makeOrder("ready");
  const secondAccept = await acceptOrderOperation({ orderId: next._id, courierUserId: courierUser._id });
  ok("courier can accept another order", secondAccept?.status === "assigned", secondAccept?.status);

  console.log("\na rejected order cannot be overwritten");
  const rejected = await makeOrder("rejected");
  let rejErr = null;
  await cancelOrder(
    { params: { orderId: String(rejected._id) }, body: {}, user: { _id: customer._id } },
    res,
    (err) => { rejErr = err; },
  );
  ok("cancelling a rejected order is refused", rejErr?.code === "CANCEL_NOT_ALLOWED", rejErr?.code ?? "it was allowed");
  ok("the rejection survived", (await Order.findById(rejected._id).lean()).status === "rejected");

  console.log("\na cancel never overwrites a courier's progress");
  const racer = await User.create({
    name: "Q", email: "q@cancel.test", password: "x", role: "courier", phoneNumber: "0633333333",
  });
  const racerCourier = await Courier.create({
    userId: racer._id, fullName: "Q", phoneNumber: "0633333333",
    email: "q@cancel.test", vehicleType: "bike", verificationStatus: "verified",
  });
  const cancelAs = (orderId) =>
    new Promise((resolve) => {
      let error = null;
      cancelOrder(
        { params: { orderId: String(orderId) }, body: {}, user: { _id: customer._id } },
        { status: () => ({ json: () => resolve(error) }) },
        (err) => {
          error = err;
          resolve(err);
        },
      );
    });
  const pickedUp = await makeOrder("picked_up");
  await Order.updateOne({ _id: pickedUp._id }, { $set: { courier: new mongoose.Types.ObjectId() } });
  const pickedErr = await cancelAs(pickedUp._id);
  ok("cancelling a picked-up order is refused", pickedErr?.code === "CANCEL_NOT_ALLOWED", pickedErr?.code);
  ok("and picked_up survives", (await Order.findById(pickedUp._id).lean()).status === "picked_up");

  // The claim locks the courier, then claims the order. Inject the customer's
  // cancel on either side of the order write.
  const realOrderUpdate = Order.findOneAndUpdate.bind(Order);
  async function claimWithCancel(when) {
    await Courier.updateOne({ _id: racerCourier._id }, { $set: { isAvailable: true, currentOrder: null } });
    const target = await makeOrder("ready");
    Order.findOneAndUpdate = async (...args) => {
      Order.findOneAndUpdate = realOrderUpdate;
      if (when === "before") await cancelAs(target._id);
      const result = await realOrderUpdate(...args);
      if (when === "after") await cancelAs(target._id);
      return result;
    };
    let error = null;
    try {
      await acceptOrderOperation({ orderId: target._id, courierUserId: racer._id });
    } catch (err) {
      error = err;
    } finally {
      Order.findOneAndUpdate = realOrderUpdate;
    }
    return {
      error,
      order: await Order.findById(target._id).lean(),
      courier: await Courier.findById(racerCourier._id).lean(),
    };
  }

  console.log("\na cancel landing before the order is claimed");
  let race = await claimWithCancel("before");
  ok("the claim is refused", Boolean(race.error), "claim succeeded");
  ok("the order stays cancelled", race.order.status === "cancelled");
  ok("the courier is free", race.courier.currentOrder === null && race.courier.isAvailable === true);

  console.log("\na cancel landing right after the order is claimed");
  race = await claimWithCancel("after");
  ok("the order ends cancelled", race.order.status === "cancelled", race.order.status);
  ok("the courier is free", race.courier.currentOrder === null && race.courier.isAvailable === true, JSON.stringify({ c: race.courier.currentOrder, a: race.courier.isAvailable }));
  let rc;

  console.log("\none courier accepting two orders at once, 25 rounds");
  const doubles = [];
  for (let i = 0; i < 25; i++) {
    await Courier.updateOne({ _id: racerCourier._id }, { $set: { currentOrder: null, isAvailable: true } });
    const [first, second] = [await makeOrder("ready"), await makeOrder("ready")];
    const results = await Promise.allSettled([
      acceptOrderOperation({ orderId: first._id, courierUserId: racer._id }),
      acceptOrderOperation({ orderId: second._id, courierUserId: racer._id }),
    ]);
    const won = results.filter((r) => r.status === "fulfilled").length;
    const assigned = await Order.find({ _id: { $in: [first._id, second._id] }, status: "assigned" }).lean();
    rc = await Courier.findById(racerCourier._id).lean();
    if (won !== 1) doubles.push(`round ${i}: ${won} accepts succeeded`);
    else if (assigned.length !== 1) doubles.push(`round ${i}: ${assigned.length} orders assigned`);
    else if (String(rc.currentOrder) !== String(assigned[0]._id)) doubles.push(`round ${i}: courier holds the wrong order`);
    await Order.updateMany({ _id: { $in: [first._id, second._id] } }, { $set: { status: "delivered" } });
  }
  ok("exactly one wins and the courier holds it", doubles.length === 0, doubles.slice(0, 3).join("; "));

  console.log("\nconcurrent cancel and claim, 25 rounds");
  const violations = [];
  for (let i = 0; i < 25; i++) {
    await Courier.updateOne({ _id: racerCourier._id }, { $set: { currentOrder: null, isAvailable: true } });
    const round = await makeOrder("ready");
    await Promise.allSettled([
      acceptOrderOperation({ orderId: round._id, courierUserId: racer._id }),
      cancelAs(round._id),
    ]);
    const o = await Order.findById(round._id).lean();
    rc = await Courier.findById(racerCourier._id).lean();
    const holds = String(rc.currentOrder) === String(round._id);
    if (o.status === "cancelled" && (holds || rc.isAvailable === false)) violations.push(`round ${i}: courier stuck on a cancelled order`);
    if (o.status === "assigned" && !holds) violations.push(`round ${i}: assigned order the courier does not hold`);
    if (!["cancelled", "assigned"].includes(o.status)) violations.push(`round ${i}: status ${o.status}`);
  }
  ok("no courier is ever stuck or orphaned", violations.length === 0, violations.slice(0, 3).join("; "));

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
