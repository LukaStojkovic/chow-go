export class AppError extends Error {
  // `code` is a stable machine-readable identifier so clients can branch on the
  // failure instead of matching English prose.
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if (code) this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}
