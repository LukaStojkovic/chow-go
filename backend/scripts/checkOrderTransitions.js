// Order status transitions under concurrency, against a throwaway in-memory
// database.
//
// Every transition except the courier claim used to be read, check, mutate,
// save - so two seller tabs could both pass the guard and both write, and a
// seller cancelling could race a courier claiming the same order. These assert
// that exactly one caller wins each race.
//
//   node scripts/checkOrderTransitions.js
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
const seller = await import("../services/restaurantOrder.service.js");
const courierSvc = await import("../services/courierOrder.service.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

// Runs the same operation twice at once and reports how many succeeded.
async function race(fn) {
  const results = await Promise.allSettled([fn(), fn()]);
  return {
    fulfilled: results.filter((r) => r.status === "fulfilled").length,
    rejected: results.filter((r) => r.status === "rejected"),
  };
}

try {
  await Promise.all([Order.init(), Restaurant.init(), Courier.init()]);

  const owner = await User.create({ name: "O", email: "o@tr.test", password: "x", role: "seller" });
  const customer = await User.create({
    name: "C", email: "c@tr.test", password: "x", role: "customer", phoneNumber: "0600000000",
  });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@tr.test", phone: "0622222222",
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
      subtotal: 9.5, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 0,
      tax: 0, total: 13.5, paymentMethod: "cash",
    });

  console.log("\ntwo seller tabs cannot both act");

  let o = await makeOrder("pending");
  let r = await race(() => seller.confirmOrderOperation(o._id, restaurant._id, 20));
  ok("only one confirm wins", r.fulfilled === 1, `${r.fulfilled} succeeded`);
  ok("the loser gets a conflict, not a silent success",
    r.rejected[0]?.reason?.code === "ORDER_STATUS_CONFLICT", r.rejected[0]?.reason?.code);
  ok("the order is confirmed once", (await Order.findById(o._id).lean()).status === "confirmed");

  o = await makeOrder("pending");
  r = await race(() => seller.rejectOrderOperation(o._id, restaurant._id, "too busy"));
  ok("only one reject wins", r.fulfilled === 1, `${r.fulfilled} succeeded`);

  o = await makeOrder("confirmed");
  r = await race(() => seller.updateOrderStatusOperation(o._id, restaurant._id, "preparing"));
  ok("only one move to preparing wins", r.fulfilled === 1, `${r.fulfilled} succeeded`);

  console.log("\nconfirm and reject cannot both land");
  o = await makeOrder("pending");
  const both = await Promise.allSettled([
    seller.confirmOrderOperation(o._id, restaurant._id, 20),
    seller.rejectOrderOperation(o._id, restaurant._id, "no"),
  ]);
  ok("exactly one of confirm/reject succeeded",
    both.filter((x) => x.status === "fulfilled").length === 1,
    String(both.filter((x) => x.status === "fulfilled").length));
  const settled = await Order.findById(o._id).lean();
  ok("the order is not left in pending", settled.status !== "pending", settled.status);

  console.log("\ntwo couriers cannot claim one order");
  const riders = [];
  for (const n of [1, 2]) {
    const u = await User.create({
      name: `R${n}`, email: `r${n}@tr.test`, password: "x", role: "courier", phoneNumber: `061000000${n}`,
    });
    await Courier.create({
      userId: u._id, fullName: `R${n}`, phoneNumber: `061000000${n}`,
      email: `r${n}@tr.test`, vehicleType: "bike", verificationStatus: "verified",
    });
    riders.push(u);
  }

  o = await makeOrder("ready");
  const claims = await Promise.allSettled(
    riders.map((u) => courierSvc.acceptOrderOperation({ orderId: o._id, courierUserId: u._id })),
  );
  ok("exactly one courier claimed it",
    claims.filter((c) => c.status === "fulfilled").length === 1,
    String(claims.filter((c) => c.status === "fulfilled").length));

  const claimed = await Order.findById(o._id).lean();
  ok("the order has exactly one courier", Boolean(claimed.courier));
  const held = await Courier.countDocuments({ currentOrder: o._id });
  ok("only one courier record holds it", held === 1, String(held));

  console.log("\na seller cancel races a courier claim");
  o = await makeOrder("ready");
  const contended = await Promise.allSettled([
    seller.cancelOrderOperation(o._id, restaurant._id, "out of stock"),
    courierSvc.acceptOrderOperation({ orderId: o._id, courierUserId: riders[1]._id }),
  ]);
  const wins = contended.filter((x) => x.status === "fulfilled").length;
  ok("exactly one of cancel/claim succeeded", wins === 1, `${wins} succeeded`);
  const final = await Order.findById(o._id).lean();
  ok("the order is either cancelled or assigned, never both",
    ["cancelled", "assigned"].includes(final.status), final.status);
  if (final.status === "cancelled") {
    ok("a cancelled order holds no courier", !final.courier, String(final.courier));
  } else {
    ok("an assigned order holds a courier", Boolean(final.courier));
  }

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
