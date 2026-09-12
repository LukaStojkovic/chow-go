// Approves or rejects a courier. acceptOrderOperation refuses orders until
// verificationStatus is "verified", and there is no admin surface yet - this is
// the stand-in for one, not a permanent answer.
//
//   node scripts/verifyCourier.js --list
//   node scripts/verifyCourier.js --email rider@example.com
//   node scripts/verifyCourier.js --email rider@example.com --reject
import "../config/env.js";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : (args[i + 1] ?? true);
};

await mongoose.connect(process.env.MONGODB_URL);
const { default: Courier } = await import("../models/Courier.js");
const { default: User } = await import("../models/User.js");

try {
  if (args.includes("--list")) {
    const couriers = await Courier.find({}, { fullName: 1, email: 1, verificationStatus: 1 })
      .sort({ createdAt: -1 })
      .lean();
    if (couriers.length === 0) console.log("no couriers");
    for (const c of couriers) {
      console.log(`  ${c.verificationStatus.padEnd(9)}  ${c.email ?? "-"}  ${c.fullName ?? ""}`);
    }
  } else {
    const email = flag("email");
    if (!email || email === true) {
      console.error("Pass --email <address>, or --list to see every courier.");
      process.exitCode = 1;
    } else {
      const status = args.includes("--reject") ? "rejected" : "verified";
      const normalized = String(email).trim().toLowerCase();

      // The courier profile carries its own email, but it may differ in casing
      // from the user record, so match either.
      const user = await User.findOne({ email: normalized });
      const courier = await Courier.findOne(
        user ? { $or: [{ userId: user._id }, { email: normalized }] } : { email: normalized },
      );

      if (!courier) {
        console.error(`No courier profile for ${normalized}.`);
        process.exitCode = 1;
      } else {
        courier.verificationStatus = status;
        await courier.save();
        console.log(`${courier.fullName || normalized} is now ${status}.`);
      }
    }
  }
} finally {
  await mongoose.disconnect();
}
