import * as Sentry from "@sentry/node";
import { env } from "./env.js";

// Preloaded with `node --import ./config/sentry.js`: under ESM, importing it
// first from index.js is too late for Express, http and Mongoose to be patched.
if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: env.isProduction ? 0.1 : 1.0,
    // The logger redacts these on the way to stdout; do the same on the way
    // to Sentry rather than relying on server-side scrubbing.
    beforeSend(event) {
      const req = event.request;
      if (req?.data) delete req.data;
      if (req?.cookies) delete req.cookies;
      if (req?.headers) {
        delete req.headers.authorization;
        delete req.headers.cookie;
        delete req.headers["x-ops-token"];
        delete req.headers["x-stats-token"];
      }
      return event;
    },
  });
}

export { Sentry };
