import jwt from "jsonwebtoken";

export function generateToken(userId, res, rememberMe = false) {
  const expiresIn = rememberMe ? "30d" : "7d";
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn,
  });

  res.cookie("jwt", token, {
    maxAge,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
}
