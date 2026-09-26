// Replaces the single-field 2dsphere index on orders.deliveryAddressSnapshot
// .location with the compound { status, courier, location } one the Order
// model now declares. Mongoose builds new indexes at boot but never drops old
// ones, and the old one only costs writes once the compound exists. Idempotent.
//
//   node scripts/migrateOrderGeoIndex.js --dry-run
//   node scripts/migrateOrderGeoIndex.js
import "../config/env.js";
import mongoose from "mongoose";

const dryRun = process.argv.includes("--dry-run");
const FIELD = "deliveryAddressSnapshot.location";

await mongoose.connect(process.env.MONGODB_URL);
const { default: Order } = await import("../models/Order.js");

try {
  const indexes = await Order.collection.indexes();
  const keyOf = (index) => Object.keys(index.key).join();
  const legacy = indexes.find((index) => keyOf(index) === FIELD);
  const compound = indexes.find((index) => keyOf(index) === `status,courier,${FIELD}`);

  console.log(`legacy single-field index: ${legacy ? legacy.name : "absent"}`);
  console.log(`compound pool index:       ${compound ? compound.name : "absent"}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing changed.");
  } else {
    if (!compound) {
      await Order.createIndexes();
      console.log("created the compound index");
    }
    if (legacy) {
      await Order.collection.dropIndex(legacy.name);
      console.log(`dropped ${legacy.name}`);
    }
    console.log("\ndone.");
  }
} finally {
  await mongoose.disconnect();
}
