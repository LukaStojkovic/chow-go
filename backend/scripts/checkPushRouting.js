// Who gets pushed about a newly available order.
//
// sendPushToUser had exactly one call site - deliverToCustomer - so the
// restaurant room and the courier pool were socket-only. A seller whose app was
// backgrounded (iOS suspends the socket within ~30s) learned nothing about a
// new order, and it sat in pending until they reopened the app.
//
// This asserts the selection query in poolPushRecipients. The emitters around
// it need a live socket server and the Expo transport; neither is worth
// standing up to check which couriers are chosen.
//
//   node scripts/checkPushRouting.js
import "../config/env.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());

const { default: User } = await import("../models/User.js");
const { default: Courier } = await import("../models/Courier.js");
const { poolPushRecipients } = await import("../services/orderSocket.service.js");
const { pushPayloadFor } = await import("../services/orderNotification.service.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  // One courier per reason to include or exclude.
  const riders = {};
  for (const [key, opts] of Object.entries({
    offline: { verificationStatus: "verified", isAvailable: true },
    connected: { verificationStatus: "verified", isAvailable: true },
    unverified: { verificationStatus: "pending", isAvailable: true },
    rejected: { verificationStatus: "rejected", isAvailable: true },
    offDuty: { verificationStatus: "verified", isAvailable: false },
    busy: { verificationStatus: "verified", isAvailable: true },
  })) {
    const user = await User.create({
      name: key, email: `${key}@push.test`, password: "x", role: "courier", phoneNumber: "0611111111",
    });
    const courier = await Courier.create({
      userId: user._id, fullName: key, phoneNumber: "0611111111",
      email: `${key}@push.test`, vehicleType: "bike", ...opts,
    });
    riders[key] = { user, courier };
  }
  await Courier.updateOne(
    { _id: riders.busy.courier._id },
    { $set: { currentOrder: new mongoose.Types.ObjectId() } },
  );

  console.log("\nonly couriers who could take the order, minus those watching");
  const connected = new Set([String(riders.connected.courier._id)]);
  const recipients = new Set(await poolPushRecipients(connected));

  ok("an eligible courier with no socket is pushed", recipients.has(String(riders.offline.user._id)));
  ok("one already watching the pool is not", !recipients.has(String(riders.connected.user._id)));
  ok("an unverified courier is not", !recipients.has(String(riders.unverified.user._id)));
  ok("a rejected courier is not", !recipients.has(String(riders.rejected.user._id)));
  ok("an off-duty courier is not", !recipients.has(String(riders.offDuty.user._id)));
  ok("one already on a delivery is not", !recipients.has(String(riders.busy.user._id)));
  ok("exactly one recipient", recipients.size === 1, `${recipients.size}`);

  console.log("\nnobody connected means everybody eligible");
  const all = await poolPushRecipients(new Set());
  ok("both eligible couriers are pushed", all.length === 2, `${all.length}`);

  console.log("\nan empty fleet is not an error");
  await Courier.updateMany({}, { $set: { isAvailable: false } });
  ok("no eligible couriers yields no recipients", (await poolPushRecipients(new Set())).length === 0);

  console.log("\nthe push copy is shared with the in-app templates");
  const order = { orderNumber: "ORD-123-ABCD", _id: new mongoose.Types.ObjectId() };
  const seller = pushPayloadFor("order_placed", order);
  const pool = pushPayloadFor("order_available", order);

  ok("the seller payload exists", Boolean(seller), "order_placed template missing");
  ok("it names the order", seller?.body?.includes("ORD-123-ABCD"), seller?.body);
  ok("it carries the order id for the deep link", seller?.data?.orderId === String(order._id));
  ok("the courier payload exists", Boolean(pool), "order_available template missing");
  ok("it names the order too", pool?.body?.includes("ORD-123-ABCD"), pool?.body);
  ok("the two say different things", seller?.title !== pool?.title, `${seller?.title} / ${pool?.title}`);

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
