// Before 5ed70a0, Google sign-in linked to any existing account with the same
// email. Whoever registered the address first with a password then shared the
// account with its real owner, and those accounts are still shared: they are
// the ones with authProvider "local", a password, and a googleId.
//
// Google verified the address, so the Google side is the one kept. --apply
// replaces the password with a random one and revokes sessions, pending reset
// codes and push devices; the owner signs in with Google or resets the
// password through their own inbox. Sockets already open stay connected until
// they drop, because this runs outside the server.
//
//   node scripts/reviewGoogleLinks.js                   # report only
//   node scripts/reviewGoogleLinks.js --apply <id> ...  # secure these accounts
//   node scripts/reviewGoogleLinks.js --apply --all     # secure every one listed
import "../config/env.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const all = args.includes("--all");
const ids = args.filter((arg) => !arg.startsWith("--"));

if (apply && !all && ids.length === 0) {
  console.error("--apply needs account ids or --all.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URL);
const { default: User } = await import("../models/User.js");

try {
  const linked = await User.find(
    { authProvider: "local", googleId: { $exists: true, $ne: null } },
    { email: 1, role: 1, createdAt: 1, googleLinkSecuredAt: 1 },
  )
    .sort({ createdAt: 1 })
    .lean();

  const pending = linked.filter((user) => !user.googleLinkSecuredAt).length;
  console.log(
    `\n${linked.length} password account(s) with a Google id linked, ${pending} not yet secured:\n`,
  );
  for (const user of linked) {
    const status = user.googleLinkSecuredAt
      ? `secured ${user.googleLinkSecuredAt.toISOString()}`
      : "NOT SECURED";
    console.log(
      `  ${user._id}  ${user.role.padEnd(8)}  ${user.email}  created ${user.createdAt?.toISOString()}  ${status}`,
    );
  }

  if (!apply) {
    console.log("\nReport only. Re-run with --apply <id> ... or --apply --all to secure them.");
  } else {
    const known = new Set(linked.map((user) => String(user._id)));
    const unknown = ids.filter((id) => !known.has(id));
    if (unknown.length) {
      console.error(`\nNot in the list above, refusing: ${unknown.join(", ")}`);
      process.exitCode = 1;
    } else {
      const targets = all ? [...known] : ids;
      for (const id of targets) {
        await User.updateOne(
          { _id: id },
          {
            $set: {
              password: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
              pushTokens: [],
              googleLinkSecuredAt: new Date(),
            },
            $inc: { tokenVersion: 1 },
            $unset: { otpHash: 1, otpExpiry: 1, resetTokenHash: 1, resetTokenExpiry: 1 },
          },
        );
        console.log(`  secured ${id}`);
      }
      console.log(`\n${targets.length} account(s) secured.`);
    }
  }
} finally {
  await mongoose.disconnect();
}
