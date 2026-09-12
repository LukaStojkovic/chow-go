import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initMonitoring() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    // Order payloads carry the customer's name, phone and full delivery
    // address including the door code.
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

// Push registration currently fails silently behind a console.warn, which is
// invisible in a release build.
export function reportError(error, context) {
  if (dsn) Sentry.captureException(error, context ? { extra: context } : undefined);
  else if (__DEV__) console.error(error, context);
}

export { Sentry };
