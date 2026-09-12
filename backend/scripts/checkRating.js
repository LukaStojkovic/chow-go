// Order ratings, against a throwaway in-memory database.
//
// The bug this pins down: `order.customerRating = {...order.customerRating}`
// spread a Mongoose subdocument's internals rather than its values, so rating
// the courier erased the restaurant rating. Because the duplicate guard keys on
// restaurantRating and not ratedAt, alternating the two calls then let a single
// delivered order inflate a restaurant's average without bound.
//
//   node scripts/checkRating.js
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
const { rateOrderOperation } = await import("../services/orderRating.service.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  const owner = await User.create({ name: "O", email: "o@rate.test", password: "x", role: "seller" });
  const customer = await User.create({
    name: "C", email: "c@rate.test", password: "x", role: "customer", phoneNumber: "0600000000",
  });
  const courierUser = await User.create({
    name: "R", email: "r@rate.test", password: "x", role: "courier", phoneNumber: "0611111111",
  });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "R", phoneNumber: "0611111111",
    email: "r@rate.test", vehicleType: "bike",
  });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "rest@rate.test", phone: "0622222222",
    cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });

  const makeDelivered = () =>
    Order.create({
      customer: customer._id, restaurant: restaurant._id, courier: courier._id,
      status: "delivered",
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 9.5, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A 1" },
      subtotal: 9.5, deliveryFee: 2.5, tax: 0, total: 13.5, paymentMethod: "cash",
    });

  console.log("\nrating one target does not erase the other");
  const order = await makeDelivered();
  await rateOrderOperation({
    orderId: order._id, customerUserId: customer._id,
    restaurantRating: 5, restaurantReview: "great pizza",
  });
  await rateOrderOperation({
    orderId: order._id, customerUserId: customer._id,
    courierRating: 4, courierReview: "quick",
  });

  const rated = await Order.findById(order._id).lean();
  ok("restaurant rating survived the courier rating", rated.customerRating?.restaurantRating === 5, String(rated.customerRating?.restaurantRating));
  ok("restaurant review survived", rated.customerRating?.restaurantReview === "great pizza", rated.customerRating?.restaurantReview);
  ok("courier rating is stored", rated.customerRating?.courierRating === 4);
  ok("ratedAt is set", Boolean(rated.customerRating?.ratedAt));

  console.log("\nthe inflation loop is closed");
  let blocked = false;
  try {
    await rateOrderOperation({ orderId: order._id, customerUserId: customer._id, restaurantRating: 5 });
  } catch {
    blocked = true;
  }
  ok("the restaurant cannot be rated twice from one order", blocked);

  let r = await Restaurant.findById(restaurant._id).lean();
  ok("totalReviews counted exactly once", r.totalReviews === 1, String(r.totalReviews));
  ok("averageRating is 5", r.averageRating === 5, String(r.averageRating));

  console.log("\nthe average is a real running mean");
  for (const score of [4, 3]) {
    const o = await makeDelivered();
    await rateOrderOperation({ orderId: o._id, customerUserId: customer._id, restaurantRating: score });
  }
  r = await Restaurant.findById(restaurant._id).lean();
  ok("totalReviews is 3", r.totalReviews === 3, String(r.totalReviews));
  ok("averageRating is 4 for 5/4/3", r.averageRating === 4, String(r.averageRating));

  console.log("\nconcurrent ratings do not lose each other");
  const orders = await Promise.all([makeDelivered(), makeDelivered(), makeDelivered(), makeDelivered()]);
  await Promise.all(
    orders.map((o) =>
      rateOrderOperation({ orderId: o._id, customerUserId: customer._id, restaurantRating: 5 }),
    ),
  );
  r = await Restaurant.findById(restaurant._id).lean();
  ok("all four concurrent ratings counted", r.totalReviews === 7, String(r.totalReviews));

  const c = await Courier.findById(courier._id).lean();
  ok("courier aggregate updated too", c.totalRatings === 1 && c.averageRating === 4, `${c.totalRatings}/${c.averageRating}`);

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
