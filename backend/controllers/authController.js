import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { sendOtpEmail } from "../utils/mail.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";

export async function login(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Invalid credentials", 400));
  }

  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword) {
    return next(new AppError("Invalid credentials", 400));
  }

  generateToken(user._id, res);

  if (user.role === "seller") {
    await user.populate("restaurant");
  }

  const response = {
    _id: user._id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt,
  };

  if (user.role === "seller" && user.restaurant) {
    response.restaurant = user.restaurant;
  }

  res.status(200).json(response);
}

export const register = async (req, res, next) => {
  const { email, name, password, role, phoneNumber } = req.body;

  if (!email || !name || !password || !role) {
    return next(new AppError("Missing required fields", 400));
  }

  if (role === "customer" && !phoneNumber) {
    return next(new AppError("Phone number is required for customers", 400));
  }

  if (password.length < 6) {
    return next(new AppError("Password too short", 400));
  }

  if (await User.exists({ email })) {
    return next(new AppError("Email already in use", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const profilePicture = req.file?.path || "";

  const user = await User.create({
    email,
    name,
    password: hashedPassword,
    role,
    phoneNumber,
    profilePicture,
  });

  if (role === "seller") {
    const sellerData = req.body;

    const requiredFields = [
      "restaurantName",
      "cuisineType",
      "restaurantPhone",
      "restaurantAddress",
      "restaurantCity",
      "restaurantZipCode",
      "openingTime",
      "closingTime",
      "restaurantLat",
      "restaurantLng",
    ];

    const missing = requiredFields.find((field) => !sellerData[field]);
    if (missing) {
      await User.findByIdAndDelete(user._id);
      return next(new AppError(`${missing} is required`, 400));
    }

    const lng = parseFloat(sellerData.restaurantLng);
    const lat = parseFloat(sellerData.restaurantLat);

    if (isNaN(lng) || isNaN(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      await User.findByIdAndDelete(user._id);
      return next(new AppError("Invalid coordinates", 400));
    }

    const restaurant = await Restaurant.create({
      ownerId: user._id,
      name: sellerData.restaurantName,
      cuisineType: sellerData.cuisineType,
      profilePicture: profilePicture || "/defaultProfilePicture.png",
      phone: sellerData.restaurantPhone,
      email: email.toLowerCase(),
      openingTime: sellerData.openingTime,
      closingTime: sellerData.closingTime,
      isActive: true,
      address: {
        street: sellerData.restaurantAddress,
        city: sellerData.restaurantCity,
        state: sellerData.restaurantState || "",
        zipCode: sellerData.restaurantZipCode,
        country: "Serbia",
      },
      coordinates: { type: "Point", coordinates: [lng, lat] },
    });

    user.restaurant = restaurant._id;
    await user.save();
    await user.populate("restaurant");
  }

  generateToken(user._id, res);

  const response = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
  };

  if (user.role === "seller" && user.restaurant) {
    response.restaurant = user.restaurant;
  }

  return res.status(201).json(response);
};

export function logout(req, res) {
  res.cookie("jwt", "", {
    maxAge: 0,
  });

  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
}

export const updateProfile = async (req, res, next) => {
  const { name, phone, currentPassword, newPassword, confirmPassword } =
    req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const updateData = {};

  if (req.file && req.file.path) {
    updateData.profilePicture = req.file.path;
  }

  if (name && name.trim()) {
    updateData.name = name.trim();
  }

  if (phone && user.role === "customer") {
    const phoneRegex = /^[+]?[0-9]{7,15}$/;

    if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
      return next(new AppError("Invalid phone number", 400));
    }

    updateData.phoneNumber = phone;
  }

  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError("All password fields are required", 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters", 400));
    }

    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCorrectPassword) {
      return next(new AppError("Current password is incorrect", 400));
    }

    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return next(new AppError("No updates provided", 400));
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select("-password");

  return res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: updatedUser,
  });
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 400));
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 5 * 60 * 1000;

  user.otp = otpCode;
  user.otpExpiry = otpExpiry;
  user.isVerifiedOtp = false;

  await user.save();

  await sendOtpEmail(email, otpCode);

  res.status(200).json({
    status: "success",
    message: "Password reset code sent to your email",
  });
};

export const verifyOtp = async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user || user.otp !== code || Date.now() > user.otpExpiry) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  user.isVerifiedOtp = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res
    .status(200)
    .json({ status: "success", message: "Email verified successfully" });
};

export async function resetPassword(req, res, next) {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user || !user.isVerifiedOtp) {
    return next(new AppError("Unauthorized request", 400));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  user.isVerifiedOtp = false;
  await user.save();

  res
    .status(200)
    .json({ status: "success", message: "Password reset successfully" });
}

export const checkAuth = (req, res) => {
  res.status(200).json(req.user);
};
