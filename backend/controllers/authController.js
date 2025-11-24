import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

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

    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.log(`Error in Login Controller ${err}`);
    res.status(500).json({ status: "failed", message: err.message });
  }
}

export async function register(req, res) {
  const { email, name, password, role } = req.body;

  try {
    if (!email || !name || !password || !role) {
      return res
        .status(400)
        .json({ status: "failed", message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "failed",
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({ email });

    if (user)
      return res.status(400).json({
        status: "failed",
        message: "That email is already in use",
      });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const profilePicture = req.file?.path || "";

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role,
      profilePicture,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        profilePicture: newUser.profilePicture,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
    } else {
      res.status(400).json({ status: "failed", message: "Invalid user data" });
    }
  } catch (err) {
    console.log(`Error in Register Controller ${err}`);
    res.status(500).json({ status: "failed", message: err.message });
  }
}

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

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
