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
} from "../controllers/authController.js";
import { createUpload } from "../middlewares/upload.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();
const uploadUser = createUpload("users");

router.post("/login", login);
router.post(
  "/register",
  uploadUser.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "restaurantImages", maxCount: 5 },
  ]),
  register
);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);

router.put(
  "/update-profile",
  protectedRoute,
  uploadUser.single("profilePicture"),
  updateProfile
);

router.get("/check", protectedRoute, checkAuth);

export default router;
