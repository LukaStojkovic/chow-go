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

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id = existing || randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/healthz" || req.url === "/readyz",
  },
  // pino-http logs the whole req/res by default, which buries the useful line
  // in a wall of headers.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
