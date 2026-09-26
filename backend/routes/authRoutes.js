import express from "express";
import {
  checkAuth,
  deleteAccount,
  exportAccount,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
  verifyOtp,
  googleCallback,
  googleCompleteProfile,
  googleExchange,
  googleLinkConfirm,
  googleLinkTicket,
} from "../controllers/authController.js";
import { createUpload } from "../middlewares/upload.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import passport from "passport";
import { accountLimiter, loginAccountLimiter, loginLimiter } from "../middlewares/rateLimit.js";
import {
  OAUTH_NONCE_COOKIE,
  isValidChallenge,
  newOAuthNonce,
  nonceMatches,
  oauthNonceCookieOptions,
  readOAuthState,
  signOAuthState,
  mobileRedirectFor,
  verifyTyped,
} from "../utils/googleHandoff.js";

const router = express.Router();
const uploadUser = createUpload("users");

router.post("/login", loginLimiter, loginAccountLimiter, login);
router.post(
  "/register",
  accountLimiter,
  uploadUser.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "restaurantImages", maxCount: 5 },
  ]),
  register
);
router.post("/register/courier", accountLimiter, register);
router.post("/forgot-password", accountLimiter, forgotPassword);
router.post("/verify-otp", accountLimiter, verifyOtp);
router.post("/reset-password", accountLimiter, resetPassword);
router.post("/logout", logout);

router.put(
  "/update-profile",
  protectedRoute,
  uploadUser.single("profilePicture"),
  updateProfile
);

// The signed state is how the callback knows which client started the flow.
router.get("/google", (req, res, next) => {
  const isMobile = req.query.client === "mobile";
  const redirect = mobileRedirectFor(req.query.redirect);
  if (isMobile && !isValidChallenge(req.query.challenge)) {
    return res.redirect(`${redirect}?error=auth_failed`);
  }
  let state;
  if (isMobile) {
    state = signOAuthState("mobile", { challenge: req.query.challenge, redirect });
  } else {
    const nonce = newOAuthNonce();
    res.cookie(OAUTH_NONCE_COOKIE, nonce, oauthNonceCookieOptions());
    state = signOAuthState("web", { nonce });
  }
  return passport.authenticate("google", { scope: ["profile", "email"], state })(
    req,
    res,
    next,
  );
});

router.post("/google/exchange", loginLimiter, googleExchange);

// Linking Google to the signed-in account. The web start is a top-level GET
// from the SPA, so the sameSite=strict session cookie authenticates it and a
// cross-site page cannot start a link for its visitor; the nonce cookie then
// ties the callback to this browser as it does for sign-in.
const googleLinkAuth = (state) =>
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    prompt: "select_account",
  });

router.get("/google/link", protectedRoute, (req, res, next) => {
  const nonce = newOAuthNonce();
  res.cookie(OAUTH_NONCE_COOKIE, nonce, oauthNonceCookieOptions());
  const link = { userId: String(req.user._id), ver: req.user.tokenVersion ?? 0 };
  return googleLinkAuth(signOAuthState("web", { nonce, link }))(req, res, next);
});

router.post("/google/link/ticket", protectedRoute, googleLinkTicket);
router.get("/google/link/start", (req, res, next) => {
  let ticket;
  try {
    ticket = verifyTyped(String(req.query.ticket ?? ""), "google_link_ticket");
  } catch {
    return res.redirect(`${mobileRedirectFor(req.query.redirect)}?linkError=link_expired`);
  }
  const state = signOAuthState("mobile", {
    challenge: ticket.challenge,
    link: ticket.link,
    redirect: mobileRedirectFor(ticket.redirect),
  });
  return googleLinkAuth(state)(req, res, next);
});
router.post("/google/link/confirm", protectedRoute, googleLinkConfirm);
router.get("/google/callback", (req, res, next) => {
  const state = readOAuthState(req.query.state);
  // Native is protected by the PKCE challenge instead: a forged callback
  // carries a challenge the victim's app cannot answer.
  if (state.client !== "mobile") {
    const cookieNonce = req.cookies?.[OAUTH_NONCE_COOKIE];
    const { maxAge, ...clearOptions } = oauthNonceCookieOptions();
    res.clearCookie(OAUTH_NONCE_COOKIE, clearOptions);
    if (!state.valid || !nonceMatches(cookieNonce, state.nonce)) {
      req.user = null;
      req.googleAuthFailure = "auth_failed";
      return googleCallback(req, res, next);
    }
  }
  return passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) return next(err);
    req.user = user || null;
    req.googleAuthFailure = user ? null : info?.reason;
    return googleCallback(req, res, next);
  })(req, res, next);
});
router.post(
  "/google/complete-profile",
  accountLimiter,
  uploadUser.fields([{ name: "restaurantImages", maxCount: 5 }]),
  googleCompleteProfile,
);

router.get("/check", protectedRoute, checkAuth);
router.get("/account/export", accountLimiter, protectedRoute, exportAccount);
router.delete("/account", protectedRoute, deleteAccount);

export default router;
