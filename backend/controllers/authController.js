import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { sendOtpEmail } from "../utils/mail.js";
import Restaurant from "../models/Restaurant.js";

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ status: "failed", message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid credentials" });

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid credentials" });
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
      role: user.role,
      createdAt: user.createdAt,
    };

    if (user.role === "seller" && user.restaurant) {
      response.restaurant = user.restaurant;
    }

    res.status(200).json(response);
  } catch (err) {
    console.log(`Error in Login Controller ${err}`);
    res.status(500).json({ status: "failed", message: err.message });
  }
}

export const register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password || !role) {
      return res
        .status(400)
        .json({ status: "failed", message: "Missing required fields" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ status: "failed", message: "Password too short" });
    }

    if (await User.exists({ email })) {
      return res
        .status(400)
        .json({ status: "failed", message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const profilePicture = req.file?.path || "";

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      role,
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
        return res
          .status(400)
          .json({ status: "failed", message: `${missing} is required` });
      }

      const lng = parseFloat(sellerData.restaurantLng);
      const lat = parseFloat(sellerData.restaurantLat);

      if (
        isNaN(lng) ||
        isNaN(lat) ||
        Math.abs(lng) > 180 ||
        Math.abs(lat) > 90
      ) {
        await User.findByIdAndDelete(user._id);
        return res
          .status(400)
          .json({ status: "failed", message: "Invalid coordinates" });
      }

      const restaurant = await Restaurant.create({
        ownerId: user._id,
        name: sellerData.restaurantName,
        cuisineType: sellerData.cuisineType,
        profileImage: profilePicture || "https://via.placeholder.com/300",
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

      user.restaurant = restaurant;
    }

    generateToken(user._id, res);

    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    };

    if (user.role === "seller") {
      response.restaurant = user.restaurant;
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
};

export function logout(req, res) {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
    });

    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully" });
  } catch (err) {
    console.log(`Error in Logout Controller ${err}`);
    res.status(500).json({ status: "failed", message: err.message });
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const userId = req.user._id;

    if (!profilePicture)
      return res.status(400).json({ message: "Profile pic is required" });

    const uploadResponse = await cloudinary.uploader.upload(profilePicture);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePicture: uploadResponse.secure_url,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log(`Error in Update Profile Controller ${err}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res
        .status(400)
        .json({ status: "failed", message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ status: "failed", message: "User not found" });
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
  } catch (err) {
    console.log(`Error in Forgot Password Controller ${err}`);
    res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  try {
    if (!email || !code) {
      return res
        .status(400)
        .json({ status: "failed", message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user || user.otp !== code || Date.now() > user.otpExpiry) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid or expired OTP" });
    }

    user.isVerifiedOtp = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res
      .status(200)
      .json({ status: "success", message: "Email verified successfully" });
  } catch (err) {
    console.log(`Error in Verify OTP Controller ${err}`);
    res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
  }
};

export async function resetPassword(req, res) {
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ status: "failed", message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !user.isVerifiedOtp) {
      return res
        .status(400)
        .json({ status: "failed", message: "Unauthorized request" });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.isVerifiedOtp = false;
    await user.save();
    res
      .status(200)
      .json({ status: "success", message: "Password reset successfully" });
  } catch (err) {
    console.log(`Error in Reset Password Controller ${err}`);
    res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
  }
}

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
