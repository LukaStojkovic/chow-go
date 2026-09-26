// Replaces the global unique index on orders.idempotencyKey with the
// per-customer one the Order model now declares. Mongoose builds new indexes
// at boot but never drops old ones, so without this the global index keeps
// enforcing cross-account uniqueness. Idempotent.
//
//   node scripts/migrateIdempotencyIndex.js --dry-run
//   node scripts/migrateIdempotencyIndex.js
import "../config/env.js";
import mongoose from "mongoose";

const dryRun = process.argv.includes("--dry-run");

await mongoose.connect(process.env.MONGODB_URL);
const { default: Order } = await import("../models/Order.js");

try {
  const indexes = await Order.collection.indexes();
  const legacy = indexes.find(
    (index) => index.unique && Object.keys(index.key).join() === "idempotencyKey",
  );
  const perCustomer = indexes.find((index) => Object.keys(index.key).join() === "customer,idempotencyKey");

  console.log(`legacy global index: ${legacy ? legacy.name : "absent"}`);
  console.log(`per-customer index:  ${perCustomer ? perCustomer.name : "absent"}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing changed.");
  } else {
    if (!perCustomer) {
      await Order.createIndexes();
      console.log("created the per-customer index");
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
