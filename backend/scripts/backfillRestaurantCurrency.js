// Restaurant.currency is new. Hydrated documents get it from the schema
// default, but every discovery read is .lean() and sees nothing, so this
// stores it on restaurants created before it existed. Idempotent.
//
//   node scripts/backfillRestaurantCurrency.js --dry-run
//   node scripts/backfillRestaurantCurrency.js
import "../config/env.js";
import mongoose from "mongoose";
import { currencyForCountry } from "@chowgo/shared/currency";

const dryRun = process.argv.includes("--dry-run");

await mongoose.connect(process.env.MONGODB_URL);
const { default: Restaurant } = await import("../models/Restaurant.js");

try {
  const missing = await Restaurant.find(
    { currency: { $exists: false } },
    { name: 1, "address.country": 1 },
  ).lean();
  const byCurrency = new Map();
  for (const restaurant of missing) {
    const currency = currencyForCountry(restaurant.address?.country);
    byCurrency.set(currency, [...(byCurrency.get(currency) ?? []), restaurant._id]);
  }

  console.log(`\n${missing.length} restaurant(s) without a currency`);
  for (const [currency, ids] of byCurrency) console.log(`  ${currency}: ${ids.length}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing changed.");
  } else {
    for (const [currency, ids] of byCurrency) {
      await Restaurant.updateMany({ _id: { $in: ids } }, { $set: { currency } });
    }
    console.log("\ndone.");
  }
} finally {
  await mongoose.disconnect();
}
