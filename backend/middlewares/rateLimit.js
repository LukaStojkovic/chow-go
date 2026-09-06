import { rateLimit } from "express-rate-limit";

const tooMany = (message) => ({ message });

const base = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

/**
 * Blunt flood protection for the whole API. Sized so a real browsing session -
 * which refetches on every socket event and polls the seller order list - never
 * reaches it, including several people sharing one NAT address.
 */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 600,
  message: tooMany("Too many requests. Please slow down and try again shortly."),
});

/**
 * Credential endpoints. Failed logins only, so someone signing in normally is
 * never counted; a password guesser gets 10 attempts per quarter hour.
 */
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: tooMany("Too many sign-in attempts. Please try again in 15 minutes."),
});

/**
 * Account creation and password resets. Successful requests count here - the
 * point is to cap how many accounts or reset mails one address can trigger.
 */
export const accountLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 20,
  message: tooMany("Too many attempts. Please try again in 15 minutes."),
});

/**
 * Discovery search runs an unindexed scan per call, so it is the cheapest
 * endpoint to abuse and the one worth capping tightest. The client debounces
 * typing, so 60 a minute is far above real use.
 */
export const searchLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 60,
  message: tooMany("Too many searches. Please wait a moment."),
});
