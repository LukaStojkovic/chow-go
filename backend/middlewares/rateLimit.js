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
 * The same budget keyed on the account instead of the address, so a guesser
 * rotating IPs still gets 10 wrong passwords per quarter hour per account.
 * The cost is that someone can lock a victim out for 15 minutes; that beats
 * unlimited guessing.
 */
export const loginAccountLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `login:${typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""}`,
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
 * The geocoding proxies are public (the address picker runs before sign-in)
 * and each miss costs a Nominatim call or a paid LocationIQ one. A person
 * picking an address makes a handful; 30 a minute leaves plenty of room.
 */
export const geocodeLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 30,
  message: tooMany("Too many location lookups. Please wait a moment."),
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
