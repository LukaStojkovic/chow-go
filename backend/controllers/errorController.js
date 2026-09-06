export function handleError(err, req, res, next) {
  console.error("ERROR", err);

  // express.json rejects oversized bodies with a typed error that would
  // otherwise surface as an opaque 500.
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      status: "fail",
      message: "Request body is too large",
    });
  }

  let error = { ...err };
  error.message = err.message || "Internal Server Error";

  let statusCode = err.statusCode || 500;
  let status = err.status || (statusCode >= 500 ? "error" : "fail");

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      success: false,
      status,
      message: error.message,
      error: err,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      status,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    status: "error",
    message: "Something went wrong",
  });
}
