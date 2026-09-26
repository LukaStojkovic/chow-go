// Two guarantees on the courier surface: the unclaimed pool never leaks a
// customer's entry details, and an unverified courier cannot take an order.
// The pool part asserts
// it never carries a customer's entry details - door code, apartment, floor,
// entrance - or either note field, while still carrying what the accept
// decision needs. Runs against a throwaway in-memory database.
//
//   node scripts/checkCourierPoolPrivacy.js
import "../config/env.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());

const { default: Order } = await import("../models/Order.js");
const { default: User } = await import("../models/User.js");
const { default: Courier } = await import("../models/Courier.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
// acceptOrderOperation populates items.menuItem, so the model must be registered.
await import("../models/MenuItem.js");
const { listAvailableOrders, acceptOrderOperation } = await import(
  "../services/courierOrder.service.js"
);

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const SECRET = {
  doorCode: "1234#",
  apartment: "12B",
  floor: "3",
  entrance: "B",
  notes: "ring twice, dog barks",
};

try {
  // $geoNear needs the 2dsphere index to exist before the first query.
  await Order.init();
  await Restaurant.init();
  await Courier.init();

  const owner = await User.create({
    name: "Owner", email: "owner@pool.test", password: "x", role: "seller",
  });
  const customer = await User.create({
    name: "Customer", email: "cust@pool.test", password: "x", role: "customer",
    phoneNumber: "0600000000",
  });
  const courierUser = await User.create({
    name: "Courier", email: "cour@pool.test", password: "x", role: "courier",
    phoneNumber: "0611111111",
  });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "Courier", phoneNumber: "0611111111",
    email: "cour@pool.test", vehicleType: "bike",
  });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "Pool Test", email: "r@pool.test",
    phone: "0622222222", cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S 1", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });

  await Order.create({
    customer: customer._id,
    restaurant: restaurant._id,
    courier: null,
    status: "ready",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 9.5, quantity: 1 }],
    deliveryAddress: new mongoose.Types.ObjectId(),
    deliveryAddressSnapshot: {
      label: "Home",
      fullAddress: "Knez Mihailova 10, Beograd",
      ...SECRET,
      location: { type: "Point", coordinates: [20.46, 44.81] },
    },
    customerNotes: "leave at the door",
    subtotal: 9.5, deliveryFee: 2.5, tax: 0, total: 13.5,
    paymentMethod: "cash",
  });

  async function setLocation(withLocation) {
    if (withLocation) {
      await Courier.updateOne(
        { _id: courier._id },
        { $set: { currentLocation: { type: "Point", coordinates: [20.45, 44.8] } } },
      );
    } else {
      await Courier.updateOne({ _id: courier._id }, { $unset: { currentLocation: 1 } });
    }
  }

  async function assertPool(label, withLocation) {
    await setLocation(withLocation);
    const { orders, geoFiltered } = await listAvailableOrders({ courierUserId: courierUser._id });
    ok(`${label}: one order returned (geoFiltered=${geoFiltered})`, orders.length === 1, `got ${orders.length}`);
    if (orders.length !== 1) return;

    // Assert on the returned shape, not on substrings: values like "3" and "B"
    // occur inside ObjectIds and coordinates and produce false positives.
    const doc = orders[0].toObject ? orders[0].toObject() : orders[0];
    const snapshot = doc.deliveryAddressSnapshot ?? {};

    for (const field of Object.keys(SECRET)) {
      ok(`${label}: ${field} withheld`, snapshot[field] === undefined, `got "${snapshot[field]}"`);
    }
    ok(`${label}: customerNotes withheld`, doc.customerNotes === undefined, `got "${doc.customerNotes}"`);
    ok(`${label}: label withheld`, snapshot.label === undefined);
    ok(`${label}: fullAddress still present`, snapshot.fullAddress === "Knez Mihailova 10, Beograd");
    ok(`${label}: dropoff coords still present`, Array.isArray(snapshot.location?.coordinates));
    ok(`${label}: restaurant still joined`, Boolean(doc.restaurant?.name));
    ok(`${label}: total still present`, Number(doc.total) === 13.5);
    ok(`${label}: paymentMethod still present`, doc.paymentMethod === "cash");
  }

  async function assertApproximate(label, withLocation) {
    await setLocation(withLocation);
    const { orders } = await listAvailableOrders({ courierUserId: courierUser._id });
    ok(`${label}: one order returned`, orders.length === 1, `got ${orders.length}`);
    if (orders.length !== 1) return;
    const doc = orders[0];
    const snapshot = doc.deliveryAddressSnapshot ?? {};
    ok(`${label}: fullAddress withheld`, snapshot.fullAddress === undefined, `got "${snapshot.fullAddress}"`);
    for (const field of [...Object.keys(SECRET), "label"]) {
      ok(`${label}: ${field} withheld`, snapshot[field] === undefined);
    }
    ok(`${label}: marked approximate`, snapshot.approximate === true);
    const [lng, lat] = snapshot.location?.coordinates ?? [];
    ok(
      `${label}: coordinates snapped to the grid`,
      Math.abs(lng / 0.002 - Math.round(lng / 0.002)) < 1e-6 &&
        Math.abs(lat / 0.002 - Math.round(lat / 0.002)) < 1e-6,
      `got ${lng},${lat}`,
    );
    ok(
      `${label}: still within ~150 m of the real point`,
      Math.abs(lng - 20.4613) <= 0.0011 && Math.abs(lat - 44.8127) <= 0.0011,
    );
    if (withLocation) {
      ok(
        `${label}: distance rounded to 500 m`,
        doc.deliveryDistance % 500 === 0,
        `got ${doc.deliveryDistance}`,
      );
    }
    ok(`${label}: restaurant still joined`, Boolean(doc.restaurant?.name));
    ok(`${label}: total still present`, Number(doc.total) === 13.5);
  }

  console.log("\ncourier pool privacy: verified courier sees the address");
  await Courier.updateOne({ _id: courier._id }, { $set: { verificationStatus: "verified" } });
  await assertPool("geo branch", true);
  await assertPool("fallback branch", false);

  console.log("\ncourier pool privacy: unverified courier sees an area");
  await Order.updateOne(
    { status: "ready" },
    { $set: { "deliveryAddressSnapshot.location.coordinates": [20.4613, 44.8127] } },
  );
  for (const status of ["pending", "rejected"]) {
    await Courier.updateOne({ _id: courier._id }, { $set: { verificationStatus: status } });
    await assertApproximate(`${status}, geo branch`, true);
    await assertApproximate(`${status}, fallback branch`, false);
  }

  console.log("\npool pagination is clamped");
  await Courier.updateOne({ _id: courier._id }, { $set: { verificationStatus: "verified" } });
  for (const [limit, page, expectLimit] of [["0", "1", 20], ["-5", "0", 20], ["abc", "x", 20], ["100000", "1", 50]]) {
    let result = null;
    let error = null;
    try {
      result = await listAvailableOrders({ courierUserId: courierUser._id, limit, page });
    } catch (err) {
      error = err.message;
    }
    ok(
      `limit=${limit} page=${page} -> limit ${expectLimit}, page 1`,
      result?.pagination?.limit === expectLimit && result?.pagination?.currentPage === 1,
      error ?? JSON.stringify(result?.pagination),
    );
  }

  // verificationStatus was written at signup and read nowhere, so an
  // unverified courier could take custody of a paid order.
  console.log("\ncourier verification gate");

  const readyOrder = await Order.findOne({ status: "ready", courier: null });

  for (const status of ["pending", "rejected"]) {
    await Courier.updateOne({ _id: courier._id }, { $set: { verificationStatus: status } });
    let code = null;
    try {
      await acceptOrderOperation({ orderId: readyOrder._id, courierUserId: courierUser._id });
    } catch (err) {
      code = err.code;
    }
    ok(`a "${status}" courier cannot accept an order`, code === "COURIER_NOT_VERIFIED", code ?? "it was accepted");
  }

  await Order.syncIndexes();
  const plan = JSON.stringify(
    await Order.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [20.46, 44.81] },
          distanceField: "d",
          spherical: true,
          query: { status: "ready", courier: null },
          key: "deliveryAddressSnapshot.location",
        },
      },
    ]).explain(),
  );
  ok(
    "the pool query uses the compound status/courier/location index",
    plan.includes("status_1_courier_1_deliveryAddressSnapshot.location_2dsphere"),
  );

  await Courier.updateOne(
    { _id: courier._id },
    { $set: { verificationStatus: "verified", isAvailable: true } },
  );
  let accepted = null;
  try {
    accepted = await acceptOrderOperation({ orderId: readyOrder._id, courierUserId: courierUser._id });
  } catch (err) {
    console.log("      (accept threw: " + err.message + ")");
  }
  ok("a verified courier can accept it", accepted?.status === "assigned", accepted?.status ?? "refused");

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
