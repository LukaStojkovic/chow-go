// Knowing someone's Expo push token must not be enough to redirect their
// notifications, while a phone genuinely handed to another account still moves.
// Also checks that live socket stats are not readable by every user in
// production. Runs against a throwaway in-memory database.
//
//   node scripts/checkPushTokens.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const TOKEN = "ExponentPushToken[victim-device-aaaaaaaaaa]";
const LEGACY = "ExponentPushToken[legacy-device-bbbbbbbbbb]";

async function register(user, body) {
  const { registerDevice } = await import("../controllers/notificationController.js");
  let error = null;
  let status = null;
  await registerDevice(
    { user, body },
    { status(code) { status = code; return this; }, json() { return this; } },
    (err) => { error = err; },
  );
  return { status, error };
}

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const make = (tag) =>
    User.create({ email: `${tag}@push.test`, name: tag, password: "x", role: "customer", phoneNumber: "0600000000" });
  const victim = await make("victim");
  const attacker = await make("attacker");
  const nextOwner = await make("next-owner");
  const tokensOf = async (user) =>
    ((await User.findById(user._id).select("+pushTokens").lean()).pushTokens ?? []).map((t) => t.token);

  console.log("\nclaiming someone else's token");
  await register(victim, { token: TOKEN, platform: "android", deviceId: "inst_victim-phone" });
  ok("the victim's device is registered", (await tokensOf(victim)).includes(TOKEN));

  let r = await register(attacker, { token: TOKEN, platform: "android" });
  ok("the token alone is refused", r.error?.code === "PUSH_TOKEN_CLAIMED", r.error?.code);
  r = await register(attacker, { token: TOKEN, platform: "android", deviceId: "inst_guess" });
  ok("a different installation id is refused", r.error?.code === "PUSH_TOKEN_CLAIMED", r.error?.code);
  ok("the victim keeps the token", (await tokensOf(victim)).includes(TOKEN));
  ok("the attacker never gets it", !(await tokensOf(attacker)).includes(TOKEN));

  console.log("\na phone handed to another account");
  r = await register(nextOwner, { token: TOKEN, platform: "android", deviceId: "inst_victim-phone" });
  ok("the same installation id moves it", r.status === 200 && !r.error, r.error?.code);
  ok("to the new account", (await tokensOf(nextOwner)).includes(TOKEN));
  ok("and off the previous one", !(await tokensOf(victim)).includes(TOKEN));

  console.log("\nregistrations from before installation ids");
  await User.updateOne(
    { _id: victim._id },
    { $push: { pushTokens: { token: LEGACY, platform: "ios", deviceId: "TQ3A.230901.001" } } },
  );
  r = await register(attacker, { token: LEGACY, platform: "ios", deviceId: "inst_new-install" });
  ok("an OS build number proves nothing, so the token still moves", r.status === 200 && (await tokensOf(attacker)).includes(LEGACY));

  console.log("\nre-registering your own device");
  r = await register(nextOwner, { token: TOKEN, platform: "android", deviceId: "inst_victim-phone" });
  ok("is accepted", r.status === 200 && !r.error);
  ok("without duplicating the entry", (await tokensOf(nextOwner)).filter((t) => t === TOKEN).length === 1);
  r = await register(nextOwner, { token: TOKEN, platform: "android", deviceId: { $ne: null } });
  ok("a non-string device id is refused", r.error?.statusCode === 400);

  console.log("\nsocket stats");
  const { socketStatsAccess } = await import("../middlewares/authMiddleware.js");
  const gate = (headers) =>
    new Promise((resolve) => socketStatsAccess({ headers, cookies: {} }, {}, (err) => resolve(err ?? null)));
  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  delete process.env.SOCKET_STATS_TOKEN;
  ok("production without SOCKET_STATS_TOKEN is a 404", (await gate({}))?.statusCode === 404);
  process.env.SOCKET_STATS_TOKEN = "operator-secret-value";
  ok("a signed-in user without the token is a 404", (await gate({ authorization: "Bearer whatever" }))?.statusCode === 404);
  ok("a wrong token is a 404", (await gate({ "x-stats-token": "operator-secret-valuX" }))?.statusCode === 404);
  ok("the operator's token is let through", (await gate({ "x-stats-token": "operator-secret-value" })) === null);
  process.env.NODE_ENV = "development";
  ok("in development it still needs a signed-in user", (await gate({}))?.statusCode === 401);
  process.env.NODE_ENV = env;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
