import User from "../models/User.js";
import Courier from "../models/Courier.js";
import jwt from "jsonwebtoken";

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.jwt || null;
}

export async function protectedRoute(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized token is invalid" });
    }

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
    next();
  } catch (err) {
    console.log(`Error in protectRoute middleware ${err}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
