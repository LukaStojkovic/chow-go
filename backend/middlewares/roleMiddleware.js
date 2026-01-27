import { AppError } from "../utils/AppError.js";

export const isSellerMiddleware = (req, res, next) => {
  if (req.user.role !== "seller") {
    return next(new AppError("Access denied. Seller role required.", 403));
  }
  next();
};

export const isCustomerMiddleware = (req, res, next) => {
  if (req.user.role !== "customer") {
    return next(new AppError("Access denied. Customer role required.", 403));
  }
  next();
};
