import express from "express";
import {
  checkAuth,
  deleteAccount,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
  verifyOtp,
  googleCallback,
  googleCompleteProfile,
  googleExchange
} from "../controllers/authController.js";
import { createUpload } from "../middlewares/upload.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import passport from "passport";
import { accountLimiter, loginLimiter } from "../middlewares/rateLimit.js";
import { isValidChallenge, signOAuthState } from "../utils/googleHandoff.js";

const router = express.Router();
const uploadUser = createUpload("users");

router.post("/login", loginLimiter, login);
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
  if (isMobile && !isValidChallenge(req.query.challenge)) {
    const base = process.env.MOBILE_REDIRECT_URL || "chowgo://auth/google";
    return res.redirect(`${base}?error=auth_failed`);
  }
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    state: isMobile
      ? signOAuthState("mobile", req.query.challenge)
      : signOAuthState("web"),
  })(req, res, next);
});

router.post("/google/exchange", loginLimiter, googleExchange);
router.get("/google/callback", (req, res, next) =>
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) return next(err);
    req.user = user || null;
    req.googleAuthFailure = user ? null : info?.reason;
    return googleCallback(req, res, next);
  })(req, res, next),
);
router.post(
  "/google/complete-profile",
  accountLimiter,
  uploadUser.fields([{ name: "restaurantImages", maxCount: 5 }]),
  googleCompleteProfile,
);

router.get("/check", protectedRoute, checkAuth);
router.delete("/account", protectedRoute, deleteAccount);

export default router;
