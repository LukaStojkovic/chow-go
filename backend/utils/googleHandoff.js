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

/**
 * The opaque `code` placed in the chowgo:// deep link. Deliberately not the
 * access token: on Android any app can claim a custom scheme, and URLs end up
 * in OS logs. It is useless on its own and must be exchanged over HTTPS.
 */
export const signHandoff = (payload) =>
  sign({ ...payload, typ: "google_handoff" }, HANDOFF_TTL);

/** Replaces req.session.googleProfile for native. */
export const signSignupState = (googleProfile) =>
  sign({ googleProfile, typ: "google_signup" }, SIGNUP_TTL);

/**
 * Carries which client started the flow through the Google round-trip.
 * Signing it also buys CSRF protection the flow does not have today.
 */
export const signOAuthState = (client) =>
  sign({ client, typ: "oauth_state" }, STATE_TTL);

/** Anything unsigned or expired falls back to the existing web behaviour. */
export function readOAuthState(state) {
  try {
    return verifyTyped(state, "oauth_state").client;
  } catch {
    return "web";
  }
}
