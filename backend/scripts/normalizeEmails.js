// User.email is now lowercased and trimmed at write, and every lookup
// normalizes - so any document already stored with different casing becomes
// unreachable by login and by password reset. This rewrites them.
//
// Run the dry run first: a collision means two accounts differ only by casing
// and a human has to decide which one survives.
//
//   node scripts/normalizeEmails.js --dry-run
//   node scripts/normalizeEmails.js
import "../config/env.js";
import mongoose from "mongoose";
import { assertDevDatabase } from "./guardDatabase.js";

const DRY_RUN = process.argv.includes("--dry-run");
if (!DRY_RUN) assertDevDatabase();

await mongoose.connect(process.env.MONGODB_URL);
const { default: User } = await import("../models/User.js");

try {
  const users = await User.find({}, { email: 1 }).lean();
  const changes = users
    .map((u) => ({ id: u._id, from: u.email, to: String(u.email).trim().toLowerCase() }))
    .filter((c) => c.from !== c.to);

  console.log(`\n${users.length} users, ${changes.length} need normalizing`);

  if (changes.length === 0) {
    console.log("nothing to do");
  } else {
    const byTarget = new Map();
    for (const c of changes) {
      byTarget.set(c.to, [...(byTarget.get(c.to) ?? []), c.from]);
    }

    const existing = new Set(users.map((u) => u.email));
    const collisions = [];
    for (const [to, froms] of byTarget) {
      if (froms.length > 1 || existing.has(to)) collisions.push({ to, froms });
    }

    if (collisions.length > 0) {
      console.error("\nCollisions - resolve these by hand before running:");
      for (const c of collisions) {
        console.error(`  ${c.to}  <-  ${c.froms.join(", ")}${existing.has(c.to) ? " (+ an existing exact match)" : ""}`);
      }
      process.exitCode = 1;
    } else {
      for (const c of changes) console.log(`  ${c.from} -> ${c.to}`);
      if (DRY_RUN) {
        console.log("\ndry run - nothing written");
      } else {
        await User.bulkWrite(
          changes.map((c) => ({
            updateOne: { filter: { _id: c.id }, update: { $set: { email: c.to } } },
          })),
        );
        console.log(`\n${changes.length} updated`);
      }
    }
  }
} finally {
  await mongoose.disconnect();
}
