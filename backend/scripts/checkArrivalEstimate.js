// The arrival estimate is revised as an order moves: when the kitchen marks
// it ready (a courier's wait plus the ride) and when the courier picks it up
// (the ride alone), with the ride worked out from the real distance.
//
//   node scripts/checkArrivalEstimate.js
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
const MINUTE = 60 * 1000;
const near = (date, expected) => Math.abs(new Date(date).getTime() - expected) < 5000;

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: Courier } = await import("../models/Courier.js");
  const { default: Order } = await import("../models/Order.js");
  await import("../models/MenuItem.js");
  const { rideMinutes, etaWhenReady, etaWhenPickedUp } = await import("../utils/deliveryEta.js");
  const restaurantOrders = await import("../services/restaurantOrder.service.js");
  const courierOrders = await import("../services/courierOrder.service.js");

  console.log("\nthe ride");
  ok("about 1.4 km takes 10 minutes (5 riding, 5 at the door)", rideMinutes([44.8, 20.45], [44.81, 20.46]) === 10,
    String(rideMinutes([44.8, 20.45], [44.81, 20.46])));
  ok("next door still takes the 8-minute minimum", rideMinutes([44.8, 20.45], [44.8001, 20.4501]) === 8);
  ok("across the country is capped at an hour", rideMinutes([44.8, 20.45], [43.32, 21.9]) === 60);
  ok("missing coordinates give no ride", rideMinutes(null, [44.8, 20.45]) === null);
  const now = Date.parse("2026-10-10T12:00:00Z");
  ok("no ride falls back to the standard 30 minutes",
    etaWhenPickedUp(null, now).getTime() === now + 30 * MINUTE && etaWhenReady(null, now).getTime() === now + 35 * MINUTE);

  const owner = await User.create({ name: "O", email: "o@eta.test", password: "x", role: "seller" });
  const customer = await User.create({ name: "C", email: "c@eta.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const courierUser = await User.create({ name: "K", email: "k@eta.test", password: "x", role: "courier" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@eta.test", phone: "0622222222", cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true,
  });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "Kurir", phoneNumber: "0600000003", email: "k@eta.test",
    vehicleType: "bike", vehicleNumber: "BG-1", vehicleModel: "V", profilePicture: "https://example.test/k.jpg",
    verificationStatus: "verified",
  });
  const placedEta = new Date(Date.now() + 90 * MINUTE);
  const order = await Order.create({
    orderNumber: "ETA-1", customer: customer._id, restaurant: restaurant._id, status: "preparing",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 900, quantity: 1 }],
    deliveryAddress: new mongoose.Types.ObjectId(),
    deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
    subtotal: 900, deliveryFee: 250, serviceFee: 150, total: 1300, paymentMethod: "cash",
    estimatedDeliveryTime: placedEta,
  });

  console.log("\nas the order moves");
  let before = Date.now();
  await restaurantOrders.updateOrderStatusOperation(order._id, restaurant._id, "ready");
  let saved = await Order.findById(order._id).lean();
  ok("marking it ready re-estimates: a courier's wait plus the 10-minute ride",
    near(saved.estimatedDeliveryTime, before + 15 * MINUTE), saved.estimatedDeliveryTime?.toISOString());
  ok("which is far earlier than the guess made at checkout", saved.estimatedDeliveryTime < placedEta);

  await Order.updateOne({ _id: order._id }, { $set: { status: "assigned", courier: courier._id, assignedAt: new Date() } });
  await Courier.updateOne({ _id: courier._id }, { $set: { currentOrder: order._id, isAvailable: false } });
  before = Date.now();
  await courierOrders.markPickedUpOperation({ orderId: order._id, courierUserId: courierUser._id });
  saved = await Order.findById(order._id).lean();
  ok("picking it up re-estimates to the ride alone", near(saved.estimatedDeliveryTime, before + 10 * MINUTE),
    saved.estimatedDeliveryTime?.toISOString());

  console.log("\nother transitions leave it alone");
  const second = await Order.create({
    orderNumber: "ETA-2", customer: customer._id, restaurant: restaurant._id, status: "confirmed",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 900, quantity: 1 }],
    deliveryAddress: new mongoose.Types.ObjectId(),
    deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
    subtotal: 900, deliveryFee: 250, serviceFee: 150, total: 1300, paymentMethod: "cash",
    estimatedDeliveryTime: placedEta,
  });
  await restaurantOrders.updateOrderStatusOperation(second._id, restaurant._id, "preparing");
  ok("starting to prepare keeps the confirmed estimate",
    (await Order.findById(second._id).lean()).estimatedDeliveryTime.getTime() === placedEta.getTime());
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
