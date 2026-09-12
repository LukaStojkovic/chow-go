import { DEFAULT_LOCALE, tFor } from "@chowgo/shared/i18n";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

// Mongoose failure modes are ordinary bad input, not outages. Left untranslated
// they fall through to a 500, which makes a typo in a URL indistinguishable
// from a broken database in monitoring and pushes clients into retry loops.
//
// Each branch returns a catalog *key* plus its interpolation values rather than
// a sentence, so the response can be rendered in the requesting user's
// language. `fields` stays machine-readable - it is keyed by form field and is
// consumed by the client, not read aloud.
function translate(err) {
  if (err.type === "entity.too.large") {
    return {
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      key: "errors:request.payloadTooLarge",
    };
  }

  if (err.name === "CastError") {
    return {
      statusCode: 400,
      code: "INVALID_ID",
      key: "errors:request.invalidId",
      params: { path: err.path, kind: err.kind === "ObjectId" ? "id" : err.kind },
      fields: { [err.path]: "invalid" },
    };
  }

  if (err.name === "ValidationError") {
    const fields = {};
    for (const [path, detail] of Object.entries(err.errors || {})) {
      fields[path] = detail.message;
    }
    return {
      statusCode: 400,
      code: "VALIDATION_FAILED",
      key: "errors:request.validationFailed",
      fields,
    };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return {
      statusCode: 409,
      code: "DUPLICATE",
      key: "errors:request.duplicate",
      params: { field },
      fields: { [field]: "duplicate" },
    };
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return {
      statusCode: 401,
      code: "INVALID_TOKEN",
      key: "errors:auth.sessionInvalid",
    };
  }

  if (err.name === "MulterError") {
    const key =
      err.code === "LIMIT_FILE_SIZE"
        ? "errors:request.uploadTooLarge"
        : err.code === "LIMIT_FILE_COUNT"
          ? "errors:request.uploadTooMany"
          : "errors:request.uploadRejected";
    return { statusCode: 400, code: `UPLOAD_${err.code}`, key };
  }

  if (err.isOperational) {
    return {
      statusCode: err.statusCode || 400,
      code: err.code || "REQUEST_FAILED",
      // An AppError built with a catalog key carries it; one built with a
      // literal sentence falls through to `message` below, untranslated.
      key: err.messageKey,
      params: err.messageParams,
      message: err.messageKey ? undefined : err.message,
    };
  }

  return null;
}

export function handleError(err, req, res, _next) {
  const translated = translate(err);
  const statusCode = translated?.statusCode ?? 500;
  const locale = req.locale || DEFAULT_LOCALE;

  const log = req.log || logger;
  if (statusCode >= 500) {
    log.error({ err }, "unhandled request error");
  } else {
    log.warn({ err: { name: err.name, message: err.message }, statusCode }, "request rejected");
  }

  if (!translated) {
    return res.status(500).json({
      success: false,
      status: "error",
      code: "INTERNAL_ERROR",
      message: tFor(locale, "errors:request.internal"),
      requestId: req.id,
      ...(env.isProduction ? {} : { error: err.message, stack: err.stack }),
    });
  }

  const message =
    translated.message ?? tFor(locale, translated.key, translated.params);

  return res.status(statusCode).json({
    success: false,
    status: statusCode >= 500 ? "error" : "fail",
    code: translated.code,
    message,
    requestId: req.id,
    ...(translated.fields ? { fields: translated.fields } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}

// Re-exported so route modules keep importing AppError from one place even
// though it now needs the catalog to render a key.
export { AppError };
