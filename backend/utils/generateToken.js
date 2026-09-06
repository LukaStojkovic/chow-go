import jwt from "jsonwebtoken";

// `typ` separates access tokens from the Google handoff tokens signed with the
// same secret.
export function generateToken(userId, res, rememberMe = false, opts = {}) {
  const expiresIn = rememberMe ? "30d" : "7d";
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  const token = jwt.sign({ userId, typ: "access" }, process.env.JWT_SECRET, {
    expiresIn,
  });

  if (!opts.skipCookie) {
    res.cookie("jwt", token, {
      maxAge,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });
  }

  return token;
}
