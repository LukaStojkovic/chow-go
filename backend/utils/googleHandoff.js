import { createHash, randomUUID, timingSafeEqual } from "crypto";
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
export const signOAuthState = (client, challenge) =>
  sign({ client, challenge, typ: "oauth_state" }, STATE_TTL);

/** Anything unsigned or expired falls back to the existing web behaviour. */
export function readOAuthState(state) {
  try {
    const { client, challenge } = verifyTyped(state, "oauth_state");
    return { client, challenge };
  } catch {
    return { client: "web" };
  }
}
