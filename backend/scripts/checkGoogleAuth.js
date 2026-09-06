/**
 * Google sign-in flow check, web and native.
 *
 * Drives googleCallback, googleExchange and googleCompleteProfile directly with
 * fake req/res objects - no Google round-trip needed, since the only thing under
 * test is what this codebase does with the profile passport hands back.
 *
 * The first block is the one that matters: native support must not change a
 * single byte of the web redirect contract.
 *
 *   node scripts/checkGoogleAuth.js
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

let passed = 0;
let failed = 0;
const ok = (l, c, d = "") => {
  c ? passed++ : failed++;
  console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${d && !c ? ` - ${d}` : ""}`);
};

await mongoose.connect(process.env.MONGODB_URL);
const User = (await import("../models/User.js")).default;

const { googleCallback, googleExchange, googleCompleteProfile } =
  await import("../controllers/authController.js");
const { signOAuthState, signSignupState } =
  await import("../utils/googleHandoff.js");

const PROFILE = {
  googleId: "test-google-id",
  name: "Google Tester",
  email: "google-tester@smoke.test",
  profilePicture: "https://example.test/avatar.png",
};

function fakeRes() {
  const res = {
    redirectedTo: null,
    statusCode: null,
    body: null,
    cookies: [],
    redirect(url) {
      this.redirectedTo = url;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

const nextError = () => {
  const captured = { error: null };
  return [
    captured,
    (err) => {
      captured.error = err;
    },
  ];
};

const existing = await User.findOne({ role: "customer" })
  .select("_id email role")
  .lean();

console.log("\nweb path must not change");
{
  const res = fakeRes();
  await googleCallback(
    { user: { ...existing, isNewUser: false }, query: {}, session: {} },
    res,
    () => {},
  );
  ok(
    "existing user redirects to FRONTEND_URL with success=true",
    res.redirectedTo ===
      `${process.env.FRONTEND_URL}/auth/google/callback?success=true`,
    res.redirectedTo,
  );
  ok(
    "and still sets the jwt cookie",
    res.cookies.some((c) => c.name === "jwt" && c.options.httpOnly),
  );
}
{
  const res = fakeRes();
  const session = {};
  await googleCallback(
    { user: { isNewUser: true, googleProfile: PROFILE }, query: {}, session },
    res,
    () => {},
  );
  ok(
    "new user redirects with newUser=true",
    res.redirectedTo ===
      `${process.env.FRONTEND_URL}/auth/google/callback?newUser=true`,
    res.redirectedTo,
  );
  ok(
    "and still stashes the profile in the session",
    session.googleProfile?.email === PROFILE.email,
  );
}
{
  const res = fakeRes();
  await googleCallback({ user: null, query: {}, session: {} }, res, () => {});
  ok(
    "failure redirects with error=auth_failed",
    res.redirectedTo ===
      `${process.env.FRONTEND_URL}/auth/google/callback?error=auth_failed`,
    res.redirectedTo,
  );
}
{
  // An unsigned or tampered state must fall back to web, never to a deep link.
  const res = fakeRes();
  await googleCallback(
    { user: null, query: { state: "garbage" }, session: {} },
    res,
    () => {},
  );
  ok(
    "a tampered state falls back to the web redirect",
    res.redirectedTo.startsWith(process.env.FRONTEND_URL),
  );
}

console.log("\nmobile path");
const mobileState = signOAuthState("mobile");
let existingCode = null;
let newUserCode = null;
{
  const res = fakeRes();
  await googleCallback(
    {
      user: { ...existing, isNewUser: false },
      query: { state: mobileState },
      session: {},
    },
    res,
    () => {},
  );
  ok(
    "existing user gets a chowgo:// deep link",
    res.redirectedTo.startsWith("chowgo://auth/google?code="),
    res.redirectedTo?.slice(0, 40),
  );
  existingCode = decodeURIComponent(
    new URL(res.redirectedTo.replace("chowgo://", "https://")).searchParams.get(
      "code",
    ),
  );
  ok(
    "the code is not an access token",
    jwt.decode(existingCode)?.typ === "google_handoff",
    jwt.decode(existingCode)?.typ,
  );
}
{
  const res = fakeRes();
  const session = {};
  await googleCallback(
    {
      user: { isNewUser: true, googleProfile: PROFILE },
      query: { state: mobileState },
      session,
    },
    res,
    () => {},
  );
  ok(
    "new user gets the same URL shape",
    res.redirectedTo.startsWith("chowgo://auth/google?code="),
  );
  ok("nothing is written to the session", session.googleProfile === undefined);
  newUserCode = decodeURIComponent(
    new URL(res.redirectedTo.replace("chowgo://", "https://")).searchParams.get(
      "code",
    ),
  );
}

console.log("\nexchange");
{
  const res = fakeRes();
  await googleExchange({ body: { code: existingCode } }, res, () => {});
  ok(
    "existing user exchanges for a session",
    res.body?.status === "authenticated",
    res.body?.status,
  );
  ok("the token is in the body", typeof res.body?.token === "string");
  ok(
    "the token is a real access token",
    jwt.decode(res.body?.token ?? "")?.typ === "access",
  );
  ok("the user object is included", res.body?.user?.email === existing.email);
}
{
  const res = fakeRes();
  await googleExchange({ body: { code: newUserCode } }, res, () => {});
  ok(
    "new user exchanges for a signup token",
    res.body?.status === "newUser",
    res.body?.status,
  );
  ok("no access token is issued yet", res.body?.token === undefined);
  ok(
    "the profile is echoed for prefilling the form",
    res.body?.profile?.email === PROFILE.email,
  );
  ok(
    "the signup token is typed",
    jwt.decode(res.body?.signupToken ?? "")?.typ === "google_signup",
  );
}
{
  const [captured, next] = nextError();
  await googleExchange({ body: { code: "not-a-token" } }, fakeRes(), next);
  ok(
    "a garbage code is rejected",
    captured.error?.statusCode === 400,
    String(captured.error?.statusCode),
  );
}
{
  const [captured, next] = nextError();
  const signupToken = signSignupState(PROFILE);
  await googleExchange({ body: { code: signupToken } }, fakeRes(), next);
  ok(
    "a signup token cannot be used as a handoff code",
    captured.error?.statusCode === 400,
  );
}

console.log("\ntyp guard on protectedRoute");
{
  const { protectedRoute } = await import("../middlewares/authMiddleware.js");
  const res = fakeRes();
  const signupToken = signSignupState(PROFILE);
  await protectedRoute(
    { headers: { authorization: `Bearer ${signupToken}` }, cookies: {} },
    res,
    () => {},
  );
  ok(
    "a signup token is rejected as an access token",
    res.statusCode === 401,
    String(res.statusCode),
  );
}

console.log("\ncomplete-profile accepts either source");
{
  const [captured, next] = nextError();
  await googleCompleteProfile({ body: {}, session: {} }, fakeRes(), next);
  ok(
    "no session and no token is a clear error",
    captured.error?.statusCode === 400,
    captured.error?.message,
  );
}
{
  const [captured, next] = nextError();
  await googleCompleteProfile(
    { body: { signupToken: "expired-nonsense" }, session: {} },
    fakeRes(),
    next,
  );
  ok(
    "an invalid signup token is a clear error",
    captured.error?.message?.includes("Signup session expired"),
    captured.error?.message,
  );
}

await mongoose.disconnect();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
