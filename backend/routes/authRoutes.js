import express from "express";
import {
  checkAuth,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/authController.js";
import upload from "../middlewares/upload.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", upload.single("profileImage"), register);
router.post("/logout", logout);

router.put("/update-profile", protectedRoute, updateProfile);

router.get("/check", protectedRoute, checkAuth);

export default router;
