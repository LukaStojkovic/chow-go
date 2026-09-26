// Grants or revokes admin access to the console at /admin. Deliberately a
// script with database access rather than something one admin can do to
// another through the API: who holds this should change rarely and on purpose.
//
//   node scripts/grantAdmin.js --list
//   node scripts/grantAdmin.js --email you@example.com
//   node scripts/grantAdmin.js --email you@example.com --revoke
import "../config/env.js";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const emailAt = args.indexOf("--email");
const email = emailAt === -1 ? null : args[emailAt + 1];
const revoke = args.includes("--revoke");

await mongoose.connect(process.env.MONGODB_URL);
const { default: User } = await import("../models/User.js");

try {
  if (args.includes("--list")) {
    const admins = await User.find({ isAdmin: true }, { email: 1, role: 1 }).lean();
    console.log(admins.length ? admins.map((a) => `  ${a.email} (${a.role})`).join("\n") : "no admins");
  } else if (!email) {
    console.error("Pass --email <address> [--revoke], or --list.");
    process.exitCode = 1;
  } else {
    // Revoking also bumps tokenVersion, so an open console session ends now
    // rather than when its token expires.
    const update = revoke
      ? { $set: { isAdmin: false }, $inc: { tokenVersion: 1 } }
      : { $set: { isAdmin: true } };
    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase(), isDeleted: { $ne: true } },
      update,
      { new: true },
    ).lean();
    if (!user) {
      console.error(`No account with the email ${email}.`);
      process.exitCode = 1;
    } else {
      console.log(`${user.email} is ${user.isAdmin ? "now an admin" : "no longer an admin"}.`);
    }
  }
} finally {
  await mongoose.disconnect();
}
