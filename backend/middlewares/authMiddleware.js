import User from "../models/User.js";
import Courier from "../models/Courier.js";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { isTokenVersionCurrent } from "../utils/generateToken.js";

export function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  return req.cookies?.jwt || null;
}

export async function protectedRoute(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError("You need to be signed in", 401, "NO_TOKEN"));
  }

  // Own catch: an expired token used to surface as a 500, which a native client
  // cannot tell apart from an outage.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return next(
      new AppError(
        expired ? "Your session has expired" : "Your session is not valid",
        401,
        expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      ),
    );
  }

  if (decoded.typ && decoded.typ !== "access") {
    return next(new AppError("Your session is not valid", 401, "INVALID_TOKEN"));
  }

  // Express 5 forwards async rejections, so a genuine database fault reaches the
  // error handler with its stack intact rather than being flattened to a 500.
  const user = await User.findById(decoded.userId).select("-password");

  if (!user || user.isDeleted) {
    return next(new AppError("Your account no longer exists", 401, "USER_GONE"));
  }

  // A password reset or change bumps tokenVersion, so every credential minted
  // before it stops working here.
  if (!isTokenVersionCurrent(decoded, user)) {
    return next(
      new AppError("Your session ended because the password changed", 401, "TOKEN_REVOKED"),
    );
  }

  if (user.role === "seller") {
    await user.populate("restaurant");
  }

  if (user.role === "courier") {
    const courierProfile = await Courier.findOne({ userId: user._id });
    if (courierProfile) {
      user.courier = courierProfile;
    }
  }

  req.user = user;
  req.tokenExp = decoded.exp;
  next();
}
