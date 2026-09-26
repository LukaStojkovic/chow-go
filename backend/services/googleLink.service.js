import User from "../models/User.js";

export const LINK_FAILURES = new Set([
  "link_expired",
  "already_linked",
  "google_in_use",
]);

/**
 * Attaches a Google identity to an account that is already signed in. The
 * caller has proved who the account is (a session bound into the OAuth state
 * or a verified handoff); `ver` pins it to the session that started the flow,
 * so a password reset in between cancels the link.
 *
 * The write is conditional on googleId still being unset and the unique index
 * refuses an id another account holds, so two racing links cannot both win.
 */
export async function linkGoogleAccount({ userId, ver }, googleId) {
  if (!userId || typeof googleId !== "string" || !googleId) {
    return { failure: "link_expired" };
  }

  const user = await User.findById(userId, { googleId: 1, tokenVersion: 1, isDeleted: 1 }).lean();
  if (!user || user.isDeleted || (user.tokenVersion ?? 0) !== (ver ?? 0)) {
    return { failure: "link_expired" };
  }
  if (user.googleId === googleId) return { linked: true };
  if (user.googleId) return { failure: "already_linked" };

  try {
    const { modifiedCount } = await User.updateOne(
      { _id: userId, googleId: null },
      { $set: { googleId } },
    );
    return modifiedCount === 1 ? { linked: true } : { failure: "already_linked" };
  } catch (error) {
    if (error?.code === 11000) return { failure: "google_in_use" };
    throw error;
  }
}
