import jwt from "jsonwebtoken";

// `typ` separates access tokens from the Google handoff tokens signed with the
// same secret. `ver` pins the token to the user's current tokenVersion, so a
// password reset or change can invalidate credentials that are already out
// there - previously nothing could.
export function generateToken(userOrId, res, rememberMe = false, opts = {}) {
  const userId = userOrId?._id ?? userOrId;
  const tokenVersion = userOrId?.tokenVersion ?? opts.tokenVersion ?? 0;

  const expiresIn = rememberMe ? "30d" : "7d";
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  const token = jwt.sign(
    { userId, typ: "access", ver: tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn },
  );

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

/**
 * A token minted before `ver` existed decodes to undefined, which is treated as
 * 0 - the default tokenVersion - so existing sessions keep working until the
 * user's version is actually bumped.
 */
export function isTokenVersionCurrent(decoded, user) {
  return (decoded?.ver ?? 0) === (user?.tokenVersion ?? 0);
}
