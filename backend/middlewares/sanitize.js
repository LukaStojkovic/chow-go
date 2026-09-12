import { AppError } from "../utils/AppError.js";

// `User.findOne({ email })` with email taken from a JSON body accepts
// {"$ne": null} as a query operator, which is a user-enumeration and
// account-takeover primitive on the auth routes. express-mongo-sanitize is the
// usual answer, but it assigns to req.query, which is a getter in Express 5 and
// throws - so this rejects the request instead of rewriting it.
//
// Rejecting rather than silently stripping is deliberate: no legitimate client
// sends a $-prefixed key, so a request that does is either an attack or a bug,
// and both are worth surfacing.
const MAX_DEPTH = 8;

function findOperatorKey(value, depth = 0) {
  if (depth > MAX_DEPTH || value === null || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const hit = findOperatorKey(entry, depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$")) return key;
    // Dotted keys reach into subdocuments on an update payload.
    if (key.includes(".")) return key;
    const hit = findOperatorKey(value[key], depth + 1);
    if (hit) return hit;
  }
  return null;
}

export function rejectMongoOperators(req, _res, next) {
  for (const source of ["body", "params"]) {
    const hit = findOperatorKey(req[source]);
    if (hit) {
      return next(new AppError(`"${hit}" is not an allowed field name`, 400, "INVALID_FIELD_NAME"));
    }
  }

  // req.query is a getter in Express 5; read it without assigning.
  const queryHit = findOperatorKey({ ...req.query });
  if (queryHit) {
    return next(
      new AppError(`"${queryHit}" is not an allowed query parameter`, 400, "INVALID_FIELD_NAME"),
    );
  }

  next();
}
