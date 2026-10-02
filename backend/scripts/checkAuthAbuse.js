// Account enumeration and brute force on the credential endpoints: one answer
// and one cost for every login failure, a cap on reset codes per account, and a
// failed-login budget per account that rotating IPs cannot reset. Drives a real
// server on a throwaway in-memory database.
//
//   node scripts/checkAuthAbuse.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import path from "path";

const PORT = 8100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const STAMP = Date.now();
const EMAIL = `abuse-${STAMP}@abuse.test`;
const PASSWORD = "correctpass1";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const mongo = await MongoMemoryServer.create();
const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: {
    ...process.env,
    MONGODB_URL: mongo.getUri(),
    PORT: String(PORT),
    JWT_SECRET: randomBytes(48).toString("base64url"),
    NODE_ENV: "development",
    LOG_LEVEL: "silent",
    MAIL_DISABLED: "true", REDIS_URL: "",
    TRUST_PROXY: "1",
  },
  stdio: ["ignore", "ignore", "inherit"],
});

let ipCounter = 1;
const freshIp = () => `10.9.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;

async function post(p, body, ip = freshIp()) {
  const started = performance.now();
  const res = await fetch(BASE + p, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });
  return {
    status: res.status,
    body: await res.json().catch(() => ({})),
    ms: performance.now() - started,
  };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  const { default: mongoose } = await import("mongoose");
  await mongoose.connect(mongo.getUri());
  const { default: User } = await import("../models/User.js");

  const reg = await post("/api/auth/register", {
    email: EMAIL, name: "Abuse", password: PASSWORD, role: "customer", phoneNumber: "0600000000",
  });
  ok("a password account exists", reg.status === 201, `${reg.status} ${reg.body.message}`);
  await User.create({
    email: `google-${STAMP}@abuse.test`, name: "Google Only", googleId: `gid-${STAMP}`,
    authProvider: "google", phoneNumber: "0600000001", role: "customer",
  });

  console.log("\nlogin failures all look the same");
  const unknown = await post("/api/auth/login", { email: `nobody-${STAMP}@abuse.test`, password: "whatever12" });
  const wrong = await post("/api/auth/login", { email: EMAIL, password: "wrongpass12" });
  const google = await post("/api/auth/login", { email: `google-${STAMP}@abuse.test`, password: "whatever12" });
  for (const [label, r] of [["unknown email", unknown], ["wrong password", wrong], ["Google-only account", google]]) {
    ok(`${label}: 400 INVALID_CREDENTIALS`, r.status === 400 && r.body.code === "INVALID_CREDENTIALS", `${r.status} ${r.body.code}`);
  }
  ok(
    "the same message for all three",
    unknown.body.message === wrong.body.message && wrong.body.message === google.body.message,
    [unknown.body.message, wrong.body.message, google.body.message].join(" | "),
  );
  ok(
    "a non-string email is a clean 400",
    (await post("/api/auth/login", { email: { $ne: null }, password: "x" })).status === 400,
  );

  const unknownTimes = [];
  const wrongTimes = [];
  for (let i = 0; i < 5; i++) {
    unknownTimes.push((await post("/api/auth/login", { email: `ghost-${i}-${STAMP}@abuse.test`, password: "whatever12" })).ms);
    wrongTimes.push((await post("/api/auth/login", { email: EMAIL, password: `wrongpass-${i}` })).ms);
  }
  ok(
    "an unknown email costs a bcrypt round like a wrong password",
    median(unknownTimes) > median(wrongTimes) * 0.5,
    `unknown ${median(unknownTimes).toFixed(0)}ms vs wrong ${median(wrongTimes).toFixed(0)}ms`,
  );

  console.log("\nreset codes are capped per account");
  const known = [];
  for (let i = 0; i < 5; i++) known.push(await post("/api/auth/forgot-password", { email: EMAIL }));
  const nobody = await post("/api/auth/forgot-password", { email: `nobody-${STAMP}@abuse.test` });
  ok(
    "every reply is identical, known or not",
    known.every((r) => r.status === 200 && r.body.message === nobody.body.message),
  );
  ok(
    "a real account replies as fast as an unknown one",
    Math.max(...known.map((r) => r.ms)) < 500,
    known.map((r) => r.ms.toFixed(0)).join(","),
  );
  let stored = null;
  for (let i = 0; i < 40; i++) {
    stored = await User.findOne({ email: EMAIL }).select("+otpRequestCount +otpHash");
    if (stored?.otpRequestCount >= 3 && stored.otpHash) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 500));
  stored = await User.findOne({ email: EMAIL }).select("+otpRequestCount +otpHash");
  ok("only three codes were issued out of five requests", stored?.otpRequestCount === 3, String(stored?.otpRequestCount));
  ok("a code exists to use", Boolean(stored?.otpHash));

  await User.updateOne(
    { email: EMAIL },
    { $set: { otpWindowStart: new Date(Date.now() - 61 * 60 * 1000) } },
  );
  const hashBefore = stored.otpHash;
  await post("/api/auth/forgot-password", { email: EMAIL });
  let renewed = null;
  for (let i = 0; i < 40; i++) {
    renewed = await User.findOne({ email: EMAIL }).select("+otpRequestCount +otpHash");
    if (renewed.otpHash !== hashBefore) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  ok("an hour later the window resets", renewed.otpRequestCount === 1 && renewed.otpHash !== hashBefore);

  console.log("\nfailed logins are budgeted per account, not just per IP");
  const victim = `victim-${STAMP}@abuse.test`;
  await post("/api/auth/register", {
    email: victim, name: "Victim", password: PASSWORD, role: "customer", phoneNumber: "0600000002",
  });
  const attempts = [];
  for (let i = 0; i < 10; i++) {
    attempts.push((await post("/api/auth/login", { email: victim, password: `guess-${i}-xx` })).status);
  }
  ok("ten wrong guesses from ten IPs are answered normally", attempts.every((s) => s === 400), attempts.join(","));
  const eleventh = await post("/api/auth/login", { email: victim, password: "guess-11-xx" });
  ok("the eleventh, from yet another IP, is refused", eleventh.status === 429, String(eleventh.status));
  ok(
    "the victim's email in different casing shares the budget",
    (await post("/api/auth/login", { email: victim.toUpperCase(), password: "guess-12-xx" })).status === 429,
  );
  ok(
    "another account is unaffected",
    (await post("/api/auth/login", { email: EMAIL, password: PASSWORD })).status === 200,
  );

  await mongoose.disconnect();
} finally {
  child.kill();
  await mongo.stop();
}

console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
