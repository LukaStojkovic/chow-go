import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Mongoose failure modes are ordinary bad input, not outages. Left untranslated
// they fall through to a 500, which makes a typo in a URL indistinguishable
// from a broken database in monitoring and pushes clients into retry loops.
function translate(err) {
  if (err.type === "entity.too.large") {
    return { statusCode: 413, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" };
  }

  if (err.name === "CastError") {
    return {
      statusCode: 400,
      code: "INVALID_ID",
      message: `"${err.path}" is not a valid ${err.kind === "ObjectId" ? "id" : err.kind}`,
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
      message: "Some of the values you sent are not valid",
      fields,
    };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return {
      statusCode: 409,
      code: "DUPLICATE",
      message: `That ${field} is already taken`,
      fields: { [field]: "duplicate" },
    };
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return { statusCode: 401, code: "INVALID_TOKEN", message: "Your session is no longer valid" };
  }

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That file is too large"
        : err.code === "LIMIT_FILE_COUNT"
          ? "Too many files"
          : "That upload was rejected";
    return { statusCode: 400, code: `UPLOAD_${err.code}`, message };
  }

  if (err.isOperational) {
    return {
      statusCode: err.statusCode || 400,
      code: err.code || "REQUEST_FAILED",
      message: err.message,
    };
  }

  return null;
}

export function handleError(err, req, res, _next) {
  const translated = translate(err);
  const statusCode = translated?.statusCode ?? 500;

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
      message: "Something went wrong",
      requestId: req.id,
      ...(env.isProduction ? {} : { error: err.message, stack: err.stack }),
    });
  }

  return res.status(statusCode).json({
    success: false,
    status: statusCode >= 500 ? "error" : "fail",
    code: translated.code,
    message: translated.message,
    requestId: req.id,
    ...(translated.fields ? { fields: translated.fields } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
