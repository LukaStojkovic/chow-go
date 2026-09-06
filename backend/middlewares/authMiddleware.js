import User from "../models/User.js";
import Courier from "../models/Courier.js";
import jwt from "jsonwebtoken";

export function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  return req.cookies?.jwt || null;
}

export async function protectedRoute(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized no token provided" });
  }

  // Own catch: an expired token used to surface as a 500, which a native client
  // cannot tell apart from an outage.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Unauthorized token is invalid" });
  }

  if (decoded.typ && decoded.typ !== "access") {
    return res.status(401).json({ message: "Unauthorized token is invalid" });
  }

  try {
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
  } catch (err) {
    console.log(`Error in protectRoute middleware ${err}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
