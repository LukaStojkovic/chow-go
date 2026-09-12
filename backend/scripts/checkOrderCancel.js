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

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
