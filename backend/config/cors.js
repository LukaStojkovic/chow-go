const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
];

export const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : DEFAULT_ORIGINS
)
  .map((origin) => origin.trim())
  .filter(Boolean);

// Shared with the socket server. A missing Origin means a native client or
// curl, never a browser making a credentialed cross-origin request.
export function corsOrigin(origin, callback) {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  return callback(new Error("Not allowed by CORS"));
}
