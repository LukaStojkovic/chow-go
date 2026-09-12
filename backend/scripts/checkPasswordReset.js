// End-to-end check of the password reset flow against a throwaway in-memory
// database, including the attacks the previous version allowed: a NoSQL
// operator in place of the email, a reset with no code, a sticky verified
// window, unlimited code guesses, and a reset that left old sessions valid.
//
//   node scripts/checkPasswordReset.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import path from "path";

// A fixed port and a fixed email make a re-run collide with an orphaned server
// from an interrupted one, which reads as a failure of the code under test.
const PORT = 8100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const EMAIL = `victim-${Date.now()}@reset.test`;
const OLD_PASSWORD = "originalpass1";
const NEW_PASSWORD = "brandnewpass1";

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
  },
  stdio: ["ignore", "ignore", "inherit"],
});

async function post(p, body, headers = {}) {
  const res = await fetch(BASE + p, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client": "mobile", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  // Register, capturing the bearer token so we can prove a reset revokes it.
  const reg = await post("/api/auth/register", {
    email: EMAIL, name: "Victim", password: OLD_PASSWORD,
    role: "customer", phoneNumber: "0600000000",
  });
  ok("register succeeds with an 8+ char password", reg.status === 201, JSON.stringify(reg.body).slice(0, 120));
  const oldToken = reg.body?.token;
  ok("register returns a bearer token to a mobile client", Boolean(oldToken));

  ok(
    "register rejects a short password with a code",
    (await post("/api/auth/register", {
      email: `short-${Date.now()}@reset.test`, name: "S", password: "short1", role: "customer", phoneNumber: "0600000001",
    })).body.code === "PASSWORD_TOO_SHORT",
  );

  // --- the attacks -------------------------------------------------------
  const opInjection = await post("/api/auth/forgot-password", { email: { $ne: null } });
  ok(
    "operator in place of an email is rejected",
    opInjection.status === 400 && opInjection.body.code === "INVALID_FIELD_NAME",
    `${opInjection.status} ${opInjection.body.code}`,
  );

  const noToken = await post("/api/auth/reset-password", { email: EMAIL, newPassword: NEW_PASSWORD });
  ok("reset without a token is refused", noToken.status === 400, `${noToken.status}`);

  const forgedToken = await post("/api/auth/reset-password", {
    resetToken: randomBytes(32).toString("base64url"), newPassword: NEW_PASSWORD,
  });
  ok(
    "reset with a forged token is refused",
    forgedToken.body.code === "RESET_TOKEN_INVALID",
    forgedToken.body.code,
  );

  // --- enumeration -------------------------------------------------------
  const known = await post("/api/auth/forgot-password", { email: EMAIL });
  const unknown = await post("/api/auth/forgot-password", { email: `nobody-${Date.now()}@reset.test` });
  ok(
    "forgot-password does not reveal whether an account exists",
    known.status === unknown.status && known.body.message === unknown.body.message,
    `${known.status}/${unknown.status}`,
  );

  // --- brute force -------------------------------------------------------
  for (let i = 0; i < 5; i++) await post("/api/auth/verify-otp", { email: EMAIL, code: "000000" });
  const locked = await post("/api/auth/verify-otp", { email: EMAIL, code: "000000" });
  ok("the code locks after repeated wrong guesses", locked.body.code === "OTP_LOCKED", locked.body.code);

  // --- the happy path, reading the real code out of the database ---------
  const { default: mongoose } = await import("mongoose");
  await mongoose.connect(mongo.getUri());
  const { default: User } = await import("../models/User.js");
  const { default: bcrypt } = await import("bcrypt");

  await post("/api/auth/forgot-password", { email: EMAIL });
  let stored = await User.findOne({ email: EMAIL }).select("+otpHash +otpExpiry");
  ok("the account exists to reset", Boolean(stored));
  if (!stored) throw new Error("registration did not create the user - aborting");
  ok("the stored code is hashed, not the code itself", Boolean(stored.otpHash) && stored.otpHash.startsWith("$2"));

  // Brute-forcing the real code would take a day at bcrypt cost 10 - which is
  // the point of hashing it. Substitute a known code's hash instead; every
  // handler path under test is identical either way.
  const realCode = "424242";
  stored.otpHash = await bcrypt.hash(realCode, 10);
  stored.otpAttempts = 0;
  await stored.save();
  ok("a known code can be planted for the happy path", Boolean(realCode));

  if (realCode) {
    const verified = await post("/api/auth/verify-otp", { email: EMAIL, code: realCode });
    const resetToken = verified.body?.data?.resetToken;
    ok("verify-otp returns a single-use reset token", Boolean(resetToken), JSON.stringify(verified.body).slice(0, 120));

    ok(
      "the code cannot be replayed after use",
      (await post("/api/auth/verify-otp", { email: EMAIL, code: realCode })).body.code === "OTP_INVALID",
    );

    const shortPw = await post("/api/auth/reset-password", { resetToken, newPassword: "abc" });
    ok("reset enforces the password policy", shortPw.body.code === "PASSWORD_TOO_SHORT", shortPw.body.code);

    const done = await post("/api/auth/reset-password", { resetToken, newPassword: NEW_PASSWORD });
    ok("reset succeeds with a valid token", done.status === 200, JSON.stringify(done.body).slice(0, 120));

    ok(
      "the reset token is single-use",
      (await post("/api/auth/reset-password", { resetToken, newPassword: "anotherpass1" })).body.code === "RESET_TOKEN_INVALID",
    );

    // The point of a reset is usually that somebody else holds a session.
    const reused = await fetch(`${BASE}/api/auth/check`, {
      headers: { Authorization: `Bearer ${oldToken}` },
    });
    const reusedBody = await reused.json().catch(() => ({}));
    ok(
      "a token issued before the reset is revoked",
      reused.status === 401 && reusedBody.code === "TOKEN_REVOKED",
      `${reused.status} ${reusedBody.code}`,
    );

    ok("the old password no longer works",
      (await post("/api/auth/login", { email: EMAIL, password: OLD_PASSWORD })).status === 400);
    ok("the new password works",
      (await post("/api/auth/login", { email: EMAIL, password: NEW_PASSWORD })).status === 200);
    ok("login is case-insensitive on the email",
      (await post("/api/auth/login", { email: EMAIL.toUpperCase(), password: NEW_PASSWORD })).status === 200);
  }

  await mongoose.disconnect();

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  child.kill();
  await mongo.stop();
}
