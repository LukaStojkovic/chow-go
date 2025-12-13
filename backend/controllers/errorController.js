export function handleError(err, req, res, next) {
  console.error("ERROR", err);

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
