// The two data-subject rights: an export holds the person's own data and
// nobody else's, and deletion leaves none of their free text, photos or
// contact details behind on records that outlive the account. Runs against a
// throwaway in-memory replica set (deletion is a transaction).
//
//   node scripts/checkAccountData.js
import "../config/env.js";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

const repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.LOG_LEVEL = "silent";
await mongoose.connect(repl.getUri());

const { default: User } = await import("../models/User.js");
const { default: Addresses } = await import("../models/Addresses.js");
const { default: Order } = await import("../models/Order.js");
const { default: Courier } = await import("../models/Courier.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
const { default: MenuItem } = await import("../models/MenuItem.js");
const { default: Notification } = await import("../models/OrderNotification.js");
const { exportAccountData } = await import("../services/accountExport.service.js");
const { deleteAccountOperation } = await import("../services/accountDeletion.service.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  await Promise.all([Order.init(), Restaurant.init(), Courier.init(), User.init()]);

  const customer = await User.create({
    name: "Ana", email: "ana@data.test", password: "x", role: "customer", phoneNumber: "0600000001",
    authProvider: "google", googleId: "g-ana", otpHash: "secret-otp",
    pushTokens: [{ token: "ExponentPushToken[ana]", platform: "ios", deviceId: "inst_1" }],
  });
  const other = await User.create({ name: "Other", email: "other@data.test", password: "x", role: "customer", phoneNumber: "0600000002" });
  const owner = await User.create({ name: "Owner", email: "owner@data.test", password: "x", role: "seller" });
  const courierUser = await User.create({ name: "Kurir", email: "kurir@data.test", password: "x", role: "courier", phoneNumber: "0600000003" });

  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "Kafana", email: "kafana@data.test", phone: "0611111111", cuisineType: "pizza",
    description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/r.jpg",
    address: { street: "S 1", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });
  await MenuItem.create({
    restaurant: restaurant._id, owner: owner._id, name: "Pica", description: "d", price: 900,
    category: "pizza", available: true, imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
  });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "Kurir", phoneNumber: "0600000003", email: "kurir@data.test",
    vehicleType: "bike", vehicleNumber: "BG-123-AA", vehicleModel: "Vespa",
    profilePicture: "https://example.test/kurir.jpg",
  });

  await Addresses.create({
    userId: customer._id, label: "Home", addressType: "house", fullAddress: "Knez Mihailova 1", doorCode: "12#",
    location: { type: "Point", coordinates: [20.46, 44.81] },
  });
  const orderBase = {
    restaurant: restaurant._id, deliveryAddress: new mongoose.Types.ObjectId(),
    subtotal: 900, deliveryFee: 250, serviceFee: 150, tax: 0, total: 1300, paymentMethod: "cash",
  };
  await Order.create({
    ...orderBase, customer: customer._id, courier: courier._id, status: "delivered",
    idempotencyKey: "key-ana-00000001",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pica", price: 900, quantity: 1, specialInstructions: "no onions, I'm allergic" }],
    deliveryAddressSnapshot: { fullAddress: "Knez Mihailova 1", doorCode: "12#", location: { type: "Point", coordinates: [20.46, 44.81] } },
    customerNotes: "ring twice",
    courierNotes: "customer met me outside",
    customerRating: { restaurantRating: 5, courierRating: 4, restaurantReview: "Ana loved it", courierReview: "Kind courier", ratedAt: new Date() },
    deviceInfo: { platform: "ios", userAgent: "ChowGo/1.0" },
  });
  await Order.create({
    ...orderBase, customer: customer._id, status: "cancelled", cancelledBy: "customer",
    cancellationReason: "moving house tomorrow",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pica", price: 900, quantity: 1 }],
    deliveryAddressSnapshot: { fullAddress: "Knez Mihailova 1", location: { type: "Point", coordinates: [20.46, 44.81] } },
  });
  await Order.create({
    ...orderBase, customer: other._id, status: "delivered",
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pica", price: 900, quantity: 1 }],
    deliveryAddressSnapshot: { fullAddress: "Other Street 9", location: { type: "Point", coordinates: [20.46, 44.81] } },
  });
  await Notification.create({
    recipient: customer._id, recipientRole: "customer", type: "order_delivered",
    order: new mongoose.Types.ObjectId(), title: "Delivered", message: "Enjoy",
  }).catch(() => {});

  console.log("\nexport: customer");
  const exported = await exportAccountData(customer._id);
  const text = JSON.stringify(exported);
  ok("has the account", exported.account.email === "ana@data.test" && exported.account.phoneNumber === "0600000001");
  ok("names the sign-in methods, not the Google id", exported.account.signInMethods.includes("google") && !text.includes("g-ana"));
  ok("has the saved address", exported.addresses?.[0]?.fullAddress === "Knez Mihailova 1");
  ok("has both orders", exported.orders?.length === 2, String(exported.orders?.length));
  ok("orders name the restaurant", exported.orders[0].restaurant === "Kafana");
  ok("keeps the customer's own review and notes", text.includes("Ana loved it") && text.includes("ring twice"));
  ok("lists devices without their tokens", exported.devices?.[0]?.platform === "ios" && !text.includes("ExponentPushToken"));
  ok("leaves out secrets", !text.includes("secret-otp") && !text.includes("key-ana-00000001") && !/"password"/.test(text));
  ok("leaves out another customer's order", !text.includes("Other Street 9"));
  ok("leaves out the courier's own notes", !text.includes("customer met me outside"));

  console.log("\nexport: seller and courier");
  const sellerExport = JSON.stringify(await exportAccountData(owner._id));
  ok("the seller gets the restaurant and menu", sellerExport.includes("kafana@data.test") && sellerExport.includes("Pica"));
  ok("but not their customers' addresses", !sellerExport.includes("Knez Mihailova"));
  const courierExport = await exportAccountData(courierUser._id);
  ok("the courier gets their profile", courierExport.courierProfile?.vehicleNumber === "BG-123-AA");
  ok("and their deliveries", courierExport.deliveries?.length === 1 && courierExport.deliveries[0].restaurant === "Kafana");
  ok("with their notes but no customer address", JSON.stringify(courierExport).includes("customer met me outside") && !JSON.stringify(courierExport).includes("Knez Mihailova"));

  console.log("\ndeletion: customer");
  await deleteAccountOperation({ user: await User.findById(customer._id), password: undefined });
  const kept = await Order.find({ customer: customer._id }).lean();
  const delivered = kept.find((o) => o.status === "delivered");
  ok("orders survive", kept.length === 2);
  ok("dish instructions are gone", !delivered.items[0].specialInstructions);
  ok("written reviews are gone", !delivered.customerRating?.restaurantReview && !delivered.customerRating?.courierReview);
  ok("star ratings stay", delivered.customerRating?.restaurantRating === 5 && delivered.customerRating?.courierRating === 4);
  ok("device info is gone", !delivered.deviceInfo);
  ok("the customer's cancellation reason is gone", !kept.find((o) => o.status === "cancelled").cancellationReason);
  ok("the courier's notes on that order are theirs and stay", delivered.courierNotes === "customer met me outside");

  console.log("\ndeletion: courier");
  // Google accounts skip the password re-check, which the fixtures cannot pass.
  await User.updateOne({ _id: courierUser._id }, { $set: { authProvider: "google" } });
  await deleteAccountOperation({ user: await User.findById(courierUser._id) });
  const gone = await Courier.findById(courier._id).lean();
  ok("plate, model and photo are gone", !gone.vehicleNumber && !gone.vehicleModel && !gone.profilePicture);
  ok("their notes on deliveries are gone", !(await Order.findOne({ courier: courier._id }).lean()).courierNotes);

  console.log("\ndeletion: seller");
  await User.updateOne({ _id: owner._id }, { $set: { authProvider: "google" } });
  await deleteAccountOperation({ user: await User.findById(owner._id) });
  const closed = await Restaurant.findById(restaurant._id).lean();
  ok("the restaurant stops trading", closed.isActive === false);
  ok("its contact details are gone", closed.email !== "kafana@data.test" && !closed.phone);
  ok("its name stays for other people's order history", closed.name === "Kafana");

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await repl.stop();
}
