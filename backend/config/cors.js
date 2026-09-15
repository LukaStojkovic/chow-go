const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
];

// An Origin header is always a bare scheme://host[:port] — no path, no trailing
// slash, host lowercased. A CORS_ORIGINS entry copied out of a browser bar or a
// dashboard usually has one of those, and would then never match anything.
function normalizeOrigin(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

const configured = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : DEFAULT_ORIGINS;

// In a single-service deploy the SPA is served by this process, so its own
// origin is always allowed: forgetting it in CORS_ORIGINS breaks the app it is
// serving, and every same-origin write is rejected before it reaches a route.
export const ALLOWED_ORIGINS = [
  ...new Set(
    [...configured, process.env.FRONTEND_URL]
      .filter(Boolean)
      .map(normalizeOrigin)
      .filter(Boolean),
  ),
];

// Shared with the socket server. A missing Origin means a native client or
// curl, never a browser making a credentialed cross-origin request.
export function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(normalizeOrigin(origin))) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed by CORS"));
}
