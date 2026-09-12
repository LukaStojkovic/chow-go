import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initMonitoring() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Order payloads carry the customer's name, phone and full delivery address
    // including the door code. Strip request bodies rather than relying on
    // server-side scrubbing.
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) delete event.request.headers.Authorization;
      }
      return event;
    },
  });
}

export function reportError(error, context) {
  if (dsn) Sentry.captureException(error, context ? { extra: context } : undefined);
  else if (import.meta.env.DEV) console.error(error, context);
}

export { Sentry };
