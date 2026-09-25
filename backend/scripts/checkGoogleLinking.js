// Google sign-in must never attach itself to an account someone else
// registered first. Runs against a throwaway in-memory database.
//
//   node scripts/checkGoogleLinking.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.FRONTEND_URL ||= "http://localhost:5173";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const profile = (email, { id = `g-${Math.random()}`, verified = true } = {}) => ({
  id,
  displayName: "Google Person",
  emails: [{ value: email, verified }],
  photos: [],
});

const fakeRes = () => ({
  redirectedTo: null,
  redirect(url) {
    this.redirectedTo = url;
  },
  cookie() {},
});

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const User = (await import("../models/User.js")).default;
  const { resolveGoogleProfile } = await import("../config/passport.js");
  const { googleCallback } = await import("../controllers/authController.js");
  const { signOAuthState } = await import("../utils/googleHandoff.js");

  const squatted = await User.create({
    email: "victim@gmail.test",
    name: "Attacker",
    password: "attackerpass1",
    phoneNumber: "0600000000",
    role: "customer",
  });

  console.log("\nexisting password account");
  {
    const r = await resolveGoogleProfile(profile("victim@gmail.test", { id: "victim-gid" }));
    ok("is refused with account_exists", r.failure === "account_exists", JSON.stringify(r));
    const after = await User.findById(squatted._id);
    ok("is not linked to the Google id", !after.googleId, after.googleId);

    const upper = await resolveGoogleProfile(profile("  Victim@GMAIL.test ", { id: "victim-gid" }));
    ok("differently cased email is refused too", upper.failure === "account_exists");
  }

  console.log("\nunverified Google email");
  {
    const r = await resolveGoogleProfile(profile("fresh@gmail.test", { verified: false }));
    ok("is refused with email_unverified", r.failure === "email_unverified");
    const json = await resolveGoogleProfile({
      id: "json-verified",
      displayName: "Json",
      emails: [{ value: "json@gmail.test" }],
      _json: { email_verified: true },
    });
    ok("_json.email_verified counts as verified", json.user?.isNewUser === true);
  }

  console.log("\nalready linked account");
  {
    const linked = await User.create({
      email: "linked@gmail.test",
      name: "Linked",
      googleId: "linked-gid",
      authProvider: "google",
      phoneNumber: "0600000001",
      role: "customer",
    });
    const r = await resolveGoogleProfile(profile("linked@gmail.test", { id: "linked-gid" }));
    ok("signs in by Google id", String(r.user?._id) === String(linked._id));
  }

  console.log("\nnew email");
  {
    const r = await resolveGoogleProfile(profile("new@gmail.test", { id: "new-gid" }));
    ok("starts a new signup", r.user?.isNewUser === true);
    ok("carries the normalized email", r.user?.googleProfile?.email === "new@gmail.test");
  }

  console.log("\ncallback redirects");
  {
    const web = fakeRes();
    await googleCallback(
      { user: null, googleAuthFailure: "account_exists", query: {}, session: {} },
      web,
      () => {},
    );
    ok("web gets error=account_exists", web.redirectedTo?.endsWith("?error=account_exists"), web.redirectedTo);

    const mobile = fakeRes();
    await googleCallback(
      {
        user: null,
        googleAuthFailure: "email_unverified",
        query: { state: signOAuthState("mobile") },
        session: {},
      },
      mobile,
      () => {},
    );
    ok(
      "mobile gets error=email_unverified on the deep link",
      mobile.redirectedTo?.includes("?error=email_unverified") && !mobile.redirectedTo.startsWith("http"),
      mobile.redirectedTo,
    );

    const other = fakeRes();
    await googleCallback(
      { user: null, googleAuthFailure: "<script>", query: {}, session: {} },
      other,
      () => {},
    );
    ok("unknown reasons collapse to auth_failed", other.redirectedTo?.endsWith("?error=auth_failed"), other.redirectedTo);
  }
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
