import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";

/**
 * Short-lived tokens carrying the Google sign-in flow across a redirect.
 *
 * The web hands the profile between the two OAuth phases through
 * `req.session`. Native cannot: the OAuth leg runs inside the system browser,
 * a separate cookie jar the app's fetch never sees, so the session cookie is
 * never presented and phase two always fails. These replace it.
 *
 * Everything here is signed with JWT_SECRET, the same key as access tokens,
 * which is exactly why each carries a `typ`. Without it a signup token would
 * verify inside protectedRoute and blow up on User.findById(undefined).
 */

const HANDOFF_TTL = "90s";
const SIGNUP_TTL = "15m";
const STATE_TTL = "10m";

const sign = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

export function verifyTyped(token, typ) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.typ !== typ) throw new Error("wrong token type");
  return decoded;
}

export const HANDOFF_TTL_MS = 90_000;

/**
 * The opaque `code` placed in the chowgo:// deep link. On Android any app can
 * claim a custom scheme, so the code alone must be worthless: it carries the
 * PKCE-style challenge the app sent when it opened the flow, and only the app
 * holding the matching verifier can exchange it. The jti makes it single-use.
 */
export const signHandoff = (payload, challenge) =>
  sign(
    { ...payload, challenge, jti: randomUUID(), typ: "google_handoff" },
    HANDOFF_TTL,
  );

const CHALLENGE = /^[a-f0-9]{64}$/;
export const isValidChallenge = (value) =>
  typeof value === "string" && CHALLENGE.test(value);

export function verifierMatches(verifier, challenge) {
  if (typeof verifier !== "string" || verifier.length < 43 || verifier.length > 128) {
    return false;
  }
  if (!isValidChallenge(challenge)) return false;
  const digest = createHash("sha256").update(verifier).digest();
  return timingSafeEqual(digest, Buffer.from(challenge, "hex"));
}

/** Replaces req.session.googleProfile for native. */
export const signSignupState = (googleProfile) =>
  sign({ googleProfile, typ: "google_signup" }, SIGNUP_TTL);

/**
 * Carries which client started the flow through the Google round-trip.
 * Signing it also buys CSRF protection the flow does not have today.
 */
export const signOAuthState = (client, { challenge, nonce, link, redirect } = {}) =>
  sign({ client, challenge, nonce, link, redirect, typ: "oauth_state" }, STATE_TTL);

/** Anything unsigned or expired falls back to the web redirect, marked invalid. */
export function readOAuthState(state) {
  try {
    const { client, challenge, nonce, link, redirect } = verifyTyped(state, "oauth_state");
    return { valid: true, client, challenge, nonce, link, redirect };
  } catch {
    return { valid: false, client: "web" };
  }
}

/**
 * The web half of login-CSRF protection: /google sets this cookie and puts the
 * same nonce in the state, and the callback refuses a state this browser did
 * not start. Lax, because Google's redirect back is a cross-site top-level GET.
 */
export const OAUTH_NONCE_COOKIE = "g_oauth_nonce";

export const oauthNonceCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV !== "development",
  path: "/api/auth/google",
  maxAge: 10 * 60 * 1000,
});

export const newOAuthNonce = () => randomBytes(32).toString("hex");

export function nonceMatches(cookieNonce, stateNonce) {
  if (typeof cookieNonce !== "string" || typeof stateNonce !== "string") return false;
  const a = Buffer.from(cookieNonce);
  const b = Buffer.from(stateNonce);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Linking Google to a signed-in account. The system browser that runs the
 * OAuth leg on native has no session, so the app first trades its bearer
 * token for this ticket and opens /google/link/start with it. The ticket
 * carries the app's challenge, and the callback hands back a
 * google_link_handoff code that only /google/link/confirm accepts, with the
 * verifier and the same account's token - so a link someone else starts on
 * this phone cannot complete.
 */
const LINK_TICKET_TTL = "2m";

export const signLinkTicket = ({ userId, ver }, challenge, redirect) =>
  sign(
    { link: { userId: String(userId), ver }, challenge, redirect, typ: "google_link_ticket" },
    LINK_TICKET_TTL,
  );

export const signLinkHandoff = ({ link, googleId }, challenge) =>
  sign(
    { link, googleId, challenge, jti: randomUUID(), typ: "google_link_handoff" },
    HANDOFF_TTL,
  );

/**
 * Where native sign-in lands. Each build variant has its own scheme so a dev,
 * preview and store build can sit on one phone without claiming each other's
 * deep links; the app says which one it is, and only these are accepted, so
 * the redirect can never be pointed anywhere else.
 */
const MOBILE_REDIRECTS = /^chowgo(-dev|-preview)?:\/\/auth\/google$/;

export const defaultMobileRedirect = () =>
  process.env.MOBILE_REDIRECT_URL || "chowgo://auth/google";

export function mobileRedirectFor(requested) {
  return typeof requested === "string" && MOBILE_REDIRECTS.test(requested)
    ? requested
    : defaultMobileRedirect();
}
