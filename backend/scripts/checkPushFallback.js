/**
 * Push fallback check.
 *
 * Asserts a push is sent exactly when the customer is NOT socket-connected, and
 * not when they are. Boots a real Socket.IO server on a throwaway port so the
 * room-empty decision is the production one rather than a stub; only the Expo
 * transport is faked, so nothing is actually delivered.
 *
 * Needs fixtures, so run the realtime smoke test with --keep first:
 *
 *   node scripts/smokeRealtime.js --keep
 *   node scripts/checkPushFallback.js
 *   node scripts/smokeRealtime.js          # cleans up
 */
import dotenv from "dotenv";
dotenv.config();

import { assertDevDatabase } from "./guardDatabase.js";
assertDevDatabase();
import http from "http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { io as ioClient } from "socket.io-client";

let passed = 0;
let failed = 0;
const ok = (l, c, d = "") => {
  c ? passed++ : failed++;
  console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${d && !c ? ` - ${d}` : ""}`);
};

await mongoose.connect(process.env.MONGODB_URL);

const User = (await import("../models/User.js")).default;
const MenuItem = (await import("../models/MenuItem.js")).default;
const Order = (await import("../models/Order.js")).default;
const Addresses = (await import("../models/Addresses.js")).default;

// Fake the transport before push.service reaches for it.
const sent = [];
const { Expo } = await import("expo-server-sdk");
Expo.prototype.sendPushNotificationsAsync = async function (messages) {
  sent.push(...messages);
  return messages.map(() => ({ status: "ok" }));
};

const { initializeSocketServer } = await import("../socket/socketServer.js");
const orderSocket = await import("../services/orderSocket.service.js");

const httpServer = http.createServer();
initializeSocketServer(httpServer);
await new Promise((resolve) => httpServer.listen(0, resolve));
const PORT = httpServer.address().port;

const customer = await User.findOne({
  email: /^smoke-customer-.*@smoke\.test$/,
}).lean();
const item = await MenuItem.findOne({ name: "Smoke Burger" }).lean();
const address = await Addresses.findOne({ userId: customer._id }).lean();

const FAKE = "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]";
// Detach first, mirroring register-device. A bare $push duplicates the device
// across reruns, and two registered devices correctly receive two messages -
// which reads as a failure but is the right behaviour.
await User.updateMany(
  { "pushTokens.token": FAKE },
  { $pull: { pushTokens: { token: FAKE } } },
);
await User.updateOne(
  { _id: customer._id },
  { $push: { pushTokens: { token: FAKE, platform: "ios" } } },
);

const order = await Order.create({
  customer: customer._id,
  restaurant: item.restaurant,
  deliveryAddress: address._id,
  items: [
    { menuItem: item._id, name: item.name, price: item.price, quantity: 1 },
  ],
  deliveryAddressSnapshot: {
    fullAddress: address.fullAddress,
    location: address.location,
  },
  paymentMethod: "cash",
  deliveryFee: 2.5,
  subtotal: 9.99,
  total: 13.99,
  status: "pending",
});

console.log("\ncustomer NOT connected");
sent.length = 0;
await orderSocket.emitOrderConfirmed(customer._id, order, 20);
ok("a push is sent", sent.length === 1, `sent ${sent.length}`);
if (sent[0]) {
  console.log(`    title: ${JSON.stringify(sent[0].title)}`);
  console.log(`    body:  ${JSON.stringify(sent[0].body)}`);
  console.log(`    data:  ${JSON.stringify(sent[0].data)}`);
  ok(
    "carries the orderId the app deep-links on",
    String(sent[0].data?.orderId) === String(order._id),
  );
  ok(
    "targets the orders channel",
    sent[0].channelId === "orders",
    sent[0].channelId,
  );
  ok(
    "copy comes from the notification template",
    sent[0].title === "Order Confirmed!",
    sent[0].title,
  );
  ok("addressed to the registered device", sent[0].to === FAKE, sent[0].to);
}

console.log("\nthe courier leg, previously silent");
for (const [fn, label, expectTitle] of [
  [orderSocket.emitOrderAssigned, "order:assigned", "Courier Assigned"],
  [orderSocket.emitOrderPickedUp, "order:picked_up", "Order Picked Up"],
  [orderSocket.emitOrderInTransit, "order:in_transit", "On The Way"],
  [orderSocket.emitOrderDelivered, "order:delivered", "Delivered"],
]) {
  sent.length = 0;
  await fn(order);
  ok(
    `${label} pushes`,
    sent.length === 1 && sent[0]?.title === expectTitle,
    `${sent.length} / ${sent[0]?.title}`,
  );
}

console.log("\ncustomer connected");
const token = jwt.sign(
  { userId: customer._id, typ: "access" },
  process.env.JWT_SECRET,
  {
    expiresIn: "1h",
  },
);
const socket = ioClient(`http://localhost:${PORT}`, {
  auth: { token },
  transports: ["websocket"],
  reconnection: false,
});
await new Promise((resolve, reject) => {
  socket.on("connect", () => socket.emit("register", { role: "customer" }));
  socket.on("registered", resolve);
  socket.on("connect_error", reject);
  setTimeout(() => reject(new Error("socket timeout")), 8000);
});

sent.length = 0;
const delivered = await new Promise((resolve) => {
  socket.once("order:confirmed", () => resolve(true));
  orderSocket.emitOrderConfirmed(customer._id, order, 20);
  setTimeout(() => resolve(false), 3000);
});
ok("the event reaches the live socket", delivered);
ok("no push while connected", sent.length === 0, `sent ${sent.length}`);

console.log("\ncourier GPS must never push");
sent.length = 0;
await orderSocket.emitCourierLocationUpdated(
  order._id,
  String(customer._id),
  [20.46, 44.81],
);
ok(
  "courier:location sends no notification",
  sent.length === 0,
  `sent ${sent.length}`,
);

socket.close();
httpServer.close();

console.log("\ncleanup");
await Order.deleteOne({ _id: order._id });
await User.updateOne(
  { _id: customer._id },
  { $pull: { pushTokens: { token: FAKE } } },
);
console.log("  done");

await mongoose.disconnect();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
