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
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isCorrectPassword = bcrypt.compare(password, user.password);

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
      type: user.type,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.log(`Error in Login Controller ${err}`);
    res.status(500).json({ status: "failed", message: err.message });
  }
}

export async function register(req, res) {
  const { email, name, password, type } = req.body;

  try {
    if (!email || !name || !password || !type) {
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
      type,
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
        type: newUser.type,
        createdAt: newUser.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
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

export function updateProfile(req, res) {
  console.log("test");
}

export function check(req, res) {
  console.log("test");
}
