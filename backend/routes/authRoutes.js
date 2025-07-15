import express from "express";
import {
  check,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/authController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", upload.single("profilePicture"), register);
router.post("/logout", logout);

router.put("/update-profile", updateProfile);

router.get("/check", check);

export default router;
