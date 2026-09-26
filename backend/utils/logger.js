import { randomUUID } from "crypto";
import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "../config/env.js";

// Order payloads carry a customer's name, phone and full delivery address
// including the door code. Redaction is applied at the serializer rather than
// the call site so a new log line cannot leak them by omission.
const REDACT_PATHS = [
  "password",
  "newPassword",
  "confirmPassword",
  "otp",
  "code",
  "token",
  "jwt",
  "authorization",
  "email",
  "phone",
  "phoneNumber",
  "pushTokens",
  "doorCode",
  "keyValue",
  "deliveryAddressSnapshot",
  "*.password",
  "*.otp",
  "*.email",
  "*.phoneNumber",
  "*.doorCode",
  "*.deliveryAddressSnapshot",
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
];

export const logger = pino({
  level: env.logLevel,
  redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  transport: env.isProduction
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
});

const pathOnly = (url) => String(url ?? "").split("?")[0];

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    // Trusted verbatim, a client could put anything - newlines, another user's
    // request id, a megabyte - into every log line and response for its request.
    const existing = req.headers["x-request-id"];
    const id =
      typeof existing === "string" && /^[A-Za-z0-9._-]{8,128}$/.test(existing)
        ? existing
        : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => pathOnly(req.url) === "/healthz" || pathOnly(req.url) === "/readyz",
  },
  // pino-http logs the whole req/res by default, which buries the useful line
  // in a wall of headers. The query string is dropped: it carries Google's
  // OAuth ?code= on the callback and customers' coordinates on discovery.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: pathOnly(req.url) }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
