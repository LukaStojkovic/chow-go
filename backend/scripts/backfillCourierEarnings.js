// Courier.totalEarnings was never written, so every courier's all-time figure
// reads 0. Delivery now adds each order's delivery fee, priority fee and tip;
// this sets the counter for orders delivered before that. It recomputes from
// the orders rather than adding, so it is safe to run again.
//
//   node scripts/backfillCourierEarnings.js --dry-run
//   node scripts/backfillCourierEarnings.js
import "../config/env.js";
import mongoose from "mongoose";
import { COURIER_EARNINGS_EXPR } from "../utils/earnings.js";
import { toMoney } from "../utils/money.js";

const dryRun = process.argv.includes("--dry-run");

await mongoose.connect(process.env.MONGODB_URL);
const { default: Order } = await import("../models/Order.js");
const { default: Courier } = await import("../models/Courier.js");

try {
  const sums = await Order.aggregate([
    { $match: { status: "delivered", courier: { $ne: null } } },
    { $group: { _id: "$courier", earnings: { $sum: COURIER_EARNINGS_EXPR } } },
  ]);
  const byCourier = new Map(sums.map((row) => [String(row._id), toMoney(row.earnings)]));

  const couriers = await Courier.find({}, { totalEarnings: 1 }).lean();
  const changes = couriers
    .map((courier) => ({
      id: courier._id,
      from: courier.totalEarnings ?? 0,
      to: byCourier.get(String(courier._id)) ?? 0,
    }))
    .filter((change) => change.from !== change.to);

  console.log(`\n${couriers.length} couriers, ${changes.length} to update`);
  for (const change of changes) console.log(`  ${change.id}  ${change.from} -> ${change.to}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing changed.");
  } else if (changes.length) {
    await Courier.bulkWrite(
      changes.map((change) => ({
        updateOne: { filter: { _id: change.id }, update: { $set: { totalEarnings: change.to } } },
      })),
    );
    console.log("\ndone.");
  }
} finally {
  await mongoose.disconnect();
}
