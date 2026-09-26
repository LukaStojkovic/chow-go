/**
 * Connecting Google to an account that already has a password.
 *
 * Drives the service, the passport verify callback, googleCallback and the
 * native ticket/confirm pair with fake req/res objects. What matters: a link
 * only lands on the account that started it, only while that session is
 * current, never steals a Google id another account holds, and the native
 * handoff cannot be traded for a session. Runs against a throwaway in-memory
 * database.
 *
 *   node scripts/checkGoogleLink.js
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import { createHash, randomBytes } from "crypto";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.JWT_SECRET ||= "check-google-link-secret-at-least-32-chars";
process.env.GOOGLE_CLIENT_ID ||= "check-client";
process.env.GOOGLE_CLIENT_SECRET ||= "check-secret";
process.env.GOOGLE_CALLBACK_URL ||= "http://localhost:8000/api/auth/google/callback";
process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (l, c, d = "") => {
  c ? passed++ : failed++;
  console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${d && !c ? ` - ${d}` : ""}`);
};

await mongoose.connect(process.env.MONGODB_URL);
const User = (await import("../models/User.js")).default;
await User.init();
const { linkGoogleAccount } = await import("../services/googleLink.service.js");
const { googleCallback, googleExchange, googleLinkTicket, googleLinkConfirm, checkAuth } =
  await import("../controllers/authController.js");
const { signOAuthState, verifyTyped } = await import("../utils/googleHandoff.js");
const { configurePassport, resolveGoogleProfile } = await import("../config/passport.js");
const passport = (await import("passport")).default;

function fakeRes() {
  return {
    redirectedTo: null,
    statusCode: null,
    body: null,
    cookies: [],
    redirect(url) {
      this.redirectedTo = url;
    },
    cookie(name) {
      this.cookies.push(name);
    },
    clearCookie() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function call(handler, req) {
  const res = fakeRes();
  let error = null;
  await handler(req, res, (err) => {
    error = err;
  });
  return { res, error };
}

const pkce = () => {
  const verifier = randomBytes(32).toString("hex");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("hex") };
};

const makeUser = (email, extra = {}) =>
  User.create({ name: "Link", email, password: "hashed", role: "customer", phoneNumber: "0600000000", ...extra });

try {
  console.log("\nthe service");
  const alice = await makeUser("alice@link.test");
  const aliceLink = { userId: String(alice._id), ver: 0 };
  ok("links a Google id to a password account", (await linkGoogleAccount(aliceLink, "g-alice")).linked === true);
  ok("the id is stored", (await User.findById(alice._id).lean()).googleId === "g-alice");
  ok("the account keeps its password sign-in", (await User.findById(alice._id).lean()).authProvider === "local");
  ok("linking the same id again is a no-op", (await linkGoogleAccount(aliceLink, "g-alice")).linked === true);
  ok(
    "a second, different Google id is refused",
    (await linkGoogleAccount(aliceLink, "g-other")).failure === "already_linked",
  );

  const bob = await makeUser("bob@link.test");
  ok(
    "an id another account holds is refused",
    (await linkGoogleAccount({ userId: String(bob._id), ver: 0 }, "g-alice")).failure === "google_in_use",
  );
  ok("and bob is left unlinked", !(await User.findById(bob._id).lean()).googleId);

  await User.updateOne({ _id: bob._id }, { $inc: { tokenVersion: 1 } });
  ok(
    "a link started before a password reset is refused",
    (await linkGoogleAccount({ userId: String(bob._id), ver: 0 }, "g-bob")).failure === "link_expired",
  );
  const racers = await Promise.all([
    linkGoogleAccount({ userId: String(bob._id), ver: 1 }, "g-bob-1"),
    linkGoogleAccount({ userId: String(bob._id), ver: 1 }, "g-bob-2"),
  ]);
  ok("two racing links: exactly one wins", racers.filter((r) => r.linked).length === 1);

  const gone = await makeUser("gone@link.test", { isDeleted: true });
  ok(
    "a deleted account cannot be linked",
    (await linkGoogleAccount({ userId: String(gone._id), ver: 0 }, "g-gone")).failure === "link_expired",
  );

  console.log("\nsigning in afterwards");
  const resolved = await resolveGoogleProfile({
    id: "g-alice",
    emails: [{ value: "whatever@gmail.test", verified: true }],
    photos: [],
  });
  ok("Google sign-in now finds the linked account", String(resolved.user?._id) === String(alice._id));

  console.log("\nthe passport verify callback");
  configurePassport();
  const strategy = passport._strategy("google");
  const verify = (state, profile) =>
    new Promise((resolve) =>
      strategy._verify({ query: { state } }, "a", "r", profile, (err, user, info) =>
        resolve({ err, user, info }),
      ),
    );
  const carolEmail = "carol@link.test";
  const carol = await makeUser(carolEmail);
  const googleProfile = { id: "g-carol", emails: [{ value: carolEmail, verified: true }], photos: [] };
  const plain = await verify(signOAuthState("web", { nonce: "n" }), googleProfile);
  ok("plain sign-in with an existing email is still refused", plain.info?.reason === "account_exists");
  const carolLink = { userId: String(carol._id), ver: 0 };
  const linkMode = await verify(signOAuthState("web", { nonce: "n", link: carolLink }), googleProfile);
  ok("link mode skips the sign-in lookup", linkMode.user?.linkProfile?.googleId === "g-carol");
  ok("and links nothing by itself", !(await User.findById(carol._id).lean()).googleId);

  console.log("\nthe web callback");
  const webState = signOAuthState("web", { nonce: "n", link: carolLink });
  const web = await call(googleCallback, {
    query: { state: webState },
    user: { linkProfile: { googleId: "g-carol" } },
  });
  ok("redirects back with linked=true", web.res.redirectedTo?.endsWith("/auth/google/callback?linked=true"), web.res.redirectedTo);
  ok("carol is linked", (await User.findById(carol._id).lean()).googleId === "g-carol");
  ok("no session cookie is minted by a link", web.res.cookies.length === 0);

  const daveLink = { userId: String((await makeUser("dave@link.test"))._id), ver: 0 };
  const taken = await call(googleCallback, {
    query: { state: signOAuthState("web", { nonce: "n", link: daveLink }) },
    user: { linkProfile: { googleId: "g-carol" } },
  });
  ok("a taken id redirects with linkError", taken.res.redirectedTo?.endsWith("?linkError=google_in_use"), taken.res.redirectedTo);
  const cancelled = await call(googleCallback, {
    query: { state: signOAuthState("web", { nonce: "n", link: daveLink }) },
    user: null,
  });
  ok("a cancelled consent redirects with linkError", cancelled.res.redirectedTo?.endsWith("?linkError=auth_failed"));

  console.log("\nnative ticket and confirm");
  const erin = await makeUser("erin@link.test");
  const erinReq = (body) => ({ body, user: erin });
  const noChallenge = await call(googleLinkTicket, erinReq({}));
  ok("a ticket needs a challenge", noChallenge.error?.statusCode === 400);
  const { verifier, challenge } = pkce();
  const issued = await call(googleLinkTicket, erinReq({ challenge }));
  const ticket = verifyTyped(issued.res.body?.ticket, "google_link_ticket");
  ok("the ticket names erin and her token version", ticket.link.userId === String(erin._id) && ticket.link.ver === 0);
  ok("and carries the challenge", ticket.challenge === challenge);
  const linkedAlready = await call(googleLinkTicket, { body: { challenge }, user: await User.findById(alice._id) });
  ok("an account already linked gets no ticket", linkedAlready.error?.code === "GOOGLE_ALREADY_LINKED");

  const mobileCallback = await call(googleCallback, {
    query: { state: signOAuthState("mobile", { challenge, link: ticket.link }) },
    user: { linkProfile: { googleId: "g-erin" } },
  });
  const linkCode = new URL(mobileCallback.res.redirectedTo).searchParams.get("linkCode");
  ok("the callback deep-links a linkCode", Boolean(linkCode), mobileCallback.res.redirectedTo);
  ok("and links nothing until the app confirms", !(await User.findById(erin._id).lean()).googleId);

  const asSession = await call(googleExchange, { body: { code: linkCode, codeVerifier: verifier } });
  ok("the linkCode cannot be exchanged for a session", asSession.error && !asSession.res.body?.token);

  const wrongVerifier = await call(googleLinkConfirm, erinReq({ code: linkCode, codeVerifier: pkce().verifier }));
  ok("confirm refuses the wrong verifier", wrongVerifier.error?.code === "HANDOFF_INVALID");
  const otherAccount = await call(googleLinkConfirm, { body: { code: linkCode, codeVerifier: verifier }, user: bob });
  ok("confirm refuses another signed-in account", otherAccount.error?.code === "HANDOFF_INVALID");
  ok("neither linked anything", !(await User.findById(erin._id).lean()).googleId);

  const confirmed = await call(googleLinkConfirm, erinReq({ code: linkCode, codeVerifier: verifier }));
  ok("confirm links with the right verifier and account", confirmed.res.body?.linked === true, confirmed.error?.message);
  ok("erin is linked", (await User.findById(erin._id).lean()).googleId === "g-erin");
  const replay = await call(googleLinkConfirm, erinReq({ code: linkCode, codeVerifier: verifier }));
  ok("the code is single-use", replay.error?.code === "HANDOFF_USED");

  const frank = await makeUser("frank@link.test");
  const f = pkce();
  const fTicket = verifyTyped(
    (await call(googleLinkTicket, { body: { challenge: f.challenge }, user: frank })).res.body.ticket,
    "google_link_ticket",
  );
  const fCallback = await call(googleCallback, {
    query: { state: signOAuthState("mobile", { challenge: f.challenge, link: fTicket.link }) },
    user: { linkProfile: { googleId: "g-erin" } },
  });
  const fCode = new URL(fCallback.res.redirectedTo).searchParams.get("linkCode");
  const fConfirm = await call(googleLinkConfirm, { body: { code: fCode, codeVerifier: f.verifier }, user: frank });
  ok("confirm reports a taken id as GOOGLE_IN_USE", fConfirm.error?.code === "GOOGLE_IN_USE");

  console.log("\nwhat clients see");
  const checked = await call(checkAuth, { user: await User.findById(erin._id).select("-password") });
  ok("checkAuth says Google is linked", checked.res.body?.googleLinked === true);
  ok("checkAuth says the account has a password", checked.res.body?.authProvider === "local");
  ok("checkAuth does not expose the Google id", !("googleId" in (checked.res.body ?? {})));

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
