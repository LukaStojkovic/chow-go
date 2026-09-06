import express from "express";
import {
  checkAuth,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
  verifyOtp,
  googleCallback,
  googleCompleteProfile
} from "../controllers/authController.js";
import { createUpload } from "../middlewares/upload.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import passport from "passport";
import { accountLimiter, loginLimiter } from "../middlewares/rateLimit.js";

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

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleCallback
);
router.post(
  "/google/complete-profile",
  accountLimiter,
  uploadUser.fields([{ name: "restaurantImages", maxCount: 5 }]),
  googleCompleteProfile,
);

router.get("/check", protectedRoute, checkAuth);

export default router;
