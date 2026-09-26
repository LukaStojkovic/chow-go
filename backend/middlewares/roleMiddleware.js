import { AppError } from "../utils/AppError.js";

export const isSellerMiddleware = (req, res, next) => {
  if (req.user.role !== "seller") {
    return next(new AppError("errors:role.sellerRequired", 403, "ROLE_REQUIRED"));
  }
  next();
};

export const isCustomerMiddleware = (req, res, next) => {
  if (req.user.role !== "customer") {
    return next(new AppError("errors:role.customerRequired", 403, "ROLE_REQUIRED"));
  }
  next();
};

export const isCourierMiddleware = (req, res, next) => {
  if (req.user.role !== "courier") {
    return next(new AppError("errors:role.courierRequired", 403, "ROLE_REQUIRED"));
  }
  next();
};

// A 404 rather than a 403, so the admin surface is not advertised to
// everyone who probes it with an ordinary account.
export const isAdminMiddleware = (req, res, next) => {
  if (req.user?.isAdmin !== true) {
    return next(new AppError("Not found", 404, "NOT_FOUND"));
  }
  next();
};
