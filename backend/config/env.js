import dotenv from "dotenv";

dotenv.config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";

// Every module that reads process.env must import this one first. Several
// modules capture env values at evaluation time (config/cors.js builds
// ALLOWED_ORIGINS, push.service.js constructs its Expo client), so a module
// graph that reaches them before dotenv has run silently falls back to
// defaults instead of failing.
const REQUIRED = [
  { key: "MONGODB_URL" },
  { key: "PORT" },
  {
    key: "JWT_SECRET",
    check: (v) => v.length >= 32,
    hint: "must be at least 32 characters",
  },
  {
    key: "SESSION_SECRET",
    check: (v) => v !== "default_secret",
    hint: 'must not be the literal "default_secret"',
  },
  { key: "CLOUDINARY_CLOUD_NAME" },
  { key: "CLOUDINARY_API_KEY" },
  { key: "CLOUDINARY_API_SECRET" },
  { key: "NODE_MAILER_EMAIL" },
  { key: "NODE_MAILER_PASSWORD" },
];

const REQUIRED_IN_PRODUCTION = [
  {
    key: "CORS_ORIGINS",
    hint: "comma-separated browser origins; without it every real origin is rejected",
  },
  {
    key: "TRUST_PROXY",
    hint: "number of proxies in front of this process, or every user shares one rate-limit bucket",
  },
  { key: "MOBILE_REDIRECT_URL" },
  { key: "FRONTEND_URL" },
];

function validate() {
  const problems = [];
  const checks = isProduction
    ? [...REQUIRED, ...REQUIRED_IN_PRODUCTION]
    : REQUIRED;

  for (const { key, check, hint } of checks) {
    const value = process.env[key];
    if (!value) {
      problems.push(`  ${key} is not set${hint ? ` — ${hint}` : ""}`);
      continue;
    }
    if (check && !check(value)) {
      problems.push(`  ${key} is invalid — ${hint}`);
    }
  }

  if (problems.length > 0) {
    console.error(
      `Refusing to start. ${problems.length} environment problem(s):\n${problems.join("\n")}`,
    );
    process.exit(1);
  }
}

validate();

export const env = {
  isProduction,
  isDevelopment: process.env.NODE_ENV === "development",
  port: Number(process.env.PORT),
  mongoUrl: process.env.MONGODB_URL,
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  logLevel: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  sentryDsn: process.env.SENTRY_DSN || "",
  // What to answer in when a request names no language and the user has no
  // stored preference. Only ever a fallback: `attachLocale` prefers the
  // client's `X-Locale`, then `User.locale`, then `Accept-Language`.
  defaultLocale: process.env.DEFAULT_LOCALE || "en",
};
