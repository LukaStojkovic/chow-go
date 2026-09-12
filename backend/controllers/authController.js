import { createHash, randomBytes, randomInt } from "crypto";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { isMobileClient, withAuthToken } from "../utils/clientType.js";
import {
  readOAuthState,
  signHandoff,
  signSignupState,
  verifyTyped,
} from "../utils/googleHandoff.js";
import { sendOtpEmail } from "../utils/mail.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";
import { deleteAccountOperation } from "../services/accountDeletion.service.js";
import {
  buildScheduleFromRange,
  isValidTimeString,
} from "../utils/schedule.js";


const OTP_TTL_MS = 5 * 60 * 1000;
const RESET_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// User.email is unique but not lowercased, while Restaurant.email is - so
// "A@b.com" and "a@b.com" could become two accounts and a user who signed up
// with capitals could not log in typing lowercase.
function normalizeEmail(value) {
  return String(value).trim().toLowerCase();
}

// The reset token is 256 bits of entropy, so a fast digest is appropriate here;
// the 6-digit OTP is bcrypt-hashed because its keyspace is small.
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

// bcrypt silently truncates at 72 bytes, so an unbounded password gives a false
// sense of strength.
function passwordPolicyError(password) {
  if (typeof password !== "string") {
    return new AppError("Password must be text", 400, "PASSWORD_INVALID");
  }
  if (password.length < 8) {
    return new AppError("Password must be at least 8 characters", 400, "PASSWORD_TOO_SHORT");
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return new AppError("Password is too long (72 bytes max)", 400, "PASSWORD_TOO_LONG");
  }
  return null;
}

export async function login(req, res, next) {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await User.findOne({ email: normalizeEmail(email), isDeleted: { $ne: true } });
  if (!user) {
    return next(new AppError("Invalid credentials", 400));
  }

  if (!user.password && user.authProvider === "google") {
    return next(new AppError("Please login with Google", 400));
  }

  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword) {
    return next(new AppError("Invalid credentials", 400));
  }

  const token = generateToken(user, res, !!rememberMe || isMobileClient(req));

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

  if (user.role === "courier") {
    const courierProfile = await Courier.findOne({ userId: user._id });
    if (courierProfile) {
      response.courier = courierProfile;
    }
  }

  res.status(200).json(withAuthToken(req, response, token));
}

export const register = async (req, res, next) => {
  const { email, name, password, role, phoneNumber } = req.body;

  if (!email || !name || !password || !role) {
    return next(new AppError("Missing required fields", 400));
  }

  if (role === "customer" && !phoneNumber) {
    return next(new AppError("Phone number is required for customers", 400));
  }

  const policyError = passwordPolicyError(password);
  if (policyError) return next(policyError);

  if (await User.exists({ email: normalizeEmail(email) })) {
    return next(new AppError("Email already in use", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const profilePicture = req.files?.profilePicture?.[0]?.path || "";

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
      "restaurantDescription",
    ];

    const missing = requiredFields.find((field) => !sellerData[field]);
    if (missing) {
      await User.findByIdAndDelete(user._id);
      return next(new AppError(`${missing} is required`, 400));
    }

    if (
      !isValidTimeString(sellerData.openingTime) ||
      !isValidTimeString(sellerData.closingTime)
    ) {
      await User.findByIdAndDelete(user._id);
      return next(
        new AppError("Operating hours must be in 24-hour HH:MM format", 400),
      );
    }

    if (
      !req.files ||
      !req.files.restaurantImages ||
      req.files.restaurantImages.length === 0
    ) {
      await User.findByIdAndDelete(user._id);
      return next(
        new AppError("At least one restaurant image is required", 400),
      );
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
      description: sellerData.restaurantDescription,
      images: req.files.restaurantImages.map((file) => file.path),
      phone: sellerData.restaurantPhone,
      email: email.toLowerCase(),
      schedule: buildScheduleFromRange(
        sellerData.openingTime,
        sellerData.closingTime,
      ),
      isActive: true,
      address: {
        street: sellerData.restaurantAddress,
        city: sellerData.restaurantCity,
        state: sellerData.restaurantState || "",
        zipCode: sellerData.restaurantZipCode,
        country: "Serbia",
      },
      location: { type: "Point", coordinates: [lng, lat] },
    });

    user.restaurant = restaurant._id;
    await user.save();
    await user.populate("restaurant");
  }

  if (role === "courier") {
    const courierData = req.body;

    const requiredCourierFields = ["vehicleType"];
    const missingCourierField = requiredCourierFields.find(
      (field) => !courierData[field],
    );

    if (missingCourierField) {
      await User.findByIdAndDelete(user._id);
      return next(new AppError(`${missingCourierField} is required`, 400));
    }

    const validVehicleTypes = ["bike", "scooter", "motorcycle", "car"];
    if (!validVehicleTypes.includes(courierData.vehicleType)) {
      await User.findByIdAndDelete(user._id);
      return next(new AppError("Invalid vehicle type", 400));
    }

    let documents = {};
    if (courierData.documents) {
      try {
        documents =
          typeof courierData.documents === "string"
            ? JSON.parse(courierData.documents)
            : courierData.documents;
      } catch {
        documents = {};
      }
    }

    const courierProfile = await Courier.create({
      userId: user._id,
      fullName: name,
      phoneNumber: phoneNumber || courierData.courierPhone || "",
      email: email.toLowerCase(),
      profilePicture: profilePicture || "",
      vehicleType: courierData.vehicleType,
      vehicleNumber: courierData.vehicleNumber || "",
      vehicleModel: courierData.vehicleModel || "",
      documents: {
        driverLicense: {
          number: documents?.driverLicense?.number || "",
          expiryDate: documents?.driverLicense?.expiryDate || null,
          verified: false,
        },
        vehicleRegistration: {
          number: documents?.vehicleRegistration?.number || "",
          expiryDate: documents?.vehicleRegistration?.expiryDate || null,
          verified: false,
        },
        insurance: {
          number: documents?.insurance?.number || "",
          expiryDate: documents?.insurance?.expiryDate || null,
          verified: false,
        },
      },
      verificationStatus: "pending",
      isAvailable: true,
    });

    const courierToken = generateToken(user, res, isMobileClient(req));

    return res.status(201).json(
      withAuthToken(
        req,
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          courier: courierProfile,
        },
        courierToken,
      ),
    );
  }

  const token = generateToken(user, res, isMobileClient(req));

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

  return res.status(201).json(withAuthToken(req, response, token));
};

export function logout(req, res) {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
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

  if (phone) {
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

    const policyError = passwordPolicyError(newPassword);
    if (policyError) return next(policyError);

    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCorrectPassword) {
      return next(new AppError("Current password is incorrect", 400));
    }

    updateData.password = await bcrypt.hash(newPassword, 12);
    // Ends every session that was minted before the change.
    updateData.tokenVersion = (user.tokenVersion ?? 0) + 1;
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

  if (!email || typeof email !== "string") {
    return next(new AppError("Email is required", 400, "EMAIL_REQUIRED"));
  }

  const user = await User.findOne({ email: normalizeEmail(email) });

  // Deliberately uniform: "User not found" here told an attacker which
  // addresses have accounts.
  const sent = {
    status: "success",
    message: "If that email has an account, a reset code is on its way.",
  };

  if (!user) return res.status(200).json(sent);

  // crypto.randomInt, not Math.random - a predictable PRNG over a 10^6 space
  // is guessable.
  const otpCode = String(randomInt(100000, 1000000));

  user.otpHash = await bcrypt.hash(otpCode, 10);
  user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  await sendOtpEmail(user.email, otpCode);

  res.status(200).json(sent);
};

export const verifyOtp = async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(new AppError("All fields are required", 400, "MISSING_FIELDS"));
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    "+otpHash +otpExpiry +otpAttempts",
  );

  const invalid = new AppError("That code is invalid or has expired", 400, "OTP_INVALID");

  if (!user?.otpHash || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
    return next(invalid);
  }

  // There was no per-account counter, so the only brake on brute-forcing a
  // 6-digit code was a 20-per-15-minutes limit keyed on IP.
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return next(
      new AppError("Too many incorrect codes. Request a new one.", 429, "OTP_LOCKED"),
    );
  }

  if (!(await bcrypt.compare(String(code), user.otpHash))) {
    user.otpAttempts += 1;
    await user.save();
    return next(invalid);
  }

  // Single-use and short-lived, in place of the old sticky boolean. The client
  // carries this to reset-password, so that endpoint no longer resolves a
  // target by email.
  const resetToken = randomBytes(32).toString("base64url");

  user.resetTokenHash = sha256(resetToken);
  user.resetTokenExpiry = new Date(Date.now() + RESET_WINDOW_MS);
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Code verified",
    data: { resetToken, expiresInMinutes: RESET_WINDOW_MS / 60000 },
  });
};

export async function resetPassword(req, res, next) {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return next(new AppError("All fields are required", 400, "MISSING_FIELDS"));
  }

  // register enforces a minimum; this path did not, so a reset could set a
  // one-character password.
  const policyError = passwordPolicyError(newPassword);
  if (policyError) return next(policyError);

  // Looked up by the token itself: the old version resolved a user by email,
  // which an unsanitized {"$ne": null} could exploit to take over whichever
  // account happened to be mid-reset.
  const user = await User.findOne({
    resetTokenHash: sha256(String(resetToken)),
    resetTokenExpiry: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpiry");

  if (!user) {
    return next(
      new AppError("That reset link is invalid or has expired", 400, "RESET_TOKEN_INVALID"),
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  // The whole point of a reset is usually that someone else holds a session.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password reset successfully. Sign in with your new password.",
  });
}

/**
 * Required by App Store Review Guideline 5.1.1(v) for any app that lets people
 * create an account, and by GDPR regardless of the stores.
 */
export async function deleteAccount(req, res, next) {
  await deleteAccountOperation({ user: req.user, password: req.body?.password });

  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  res.status(200).json({
    status: "success",
    message: "Your account has been deleted.",
  });
}

export const checkAuth = (req, res) => {
  const response = {
    _id: req.user._id,
    email: req.user.email,
    name: req.user.name,
    profilePicture: req.user.profilePicture,
    phoneNumber: req.user.phoneNumber,
    role: req.user.role,
    createdAt: req.user.createdAt,
  };

  if (req.user.role === "seller" && req.user.restaurant) {
    response.restaurant = req.user.restaurant;
  }

  if (req.user.role === "courier" && req.user.courier) {
    response.courier = req.user.courier;
  }

  res.status(200).json(response);
};

export const googleCallback = async (req, res, next) => {
  const data = req.user;
  const isMobile = readOAuthState(req.query.state) === "mobile";
  const base = isMobile
    ? process.env.MOBILE_REDIRECT_URL || "chowgo://auth/google"
    : `${process.env.FRONTEND_URL}/auth/google/callback`;

  if (!data) {
    return res.redirect(`${base}?error=auth_failed`);
  }

  if (isMobile) {
    // One opaque parameter for both cases: the app does not branch until after
    // the exchange, which keeps the deep-link surface as small as possible.
    const code = data.isNewUser
      ? signHandoff({ newUser: true, googleProfile: data.googleProfile })
      : signHandoff({ newUser: false, userId: String(data._id) });

    return res.redirect(`${base}?code=${encodeURIComponent(code)}`);
  }

  if (data.isNewUser) {
    req.session.googleProfile = data.googleProfile;
    return res.redirect(`${base}?newUser=true`);
  }
  generateToken(data, res);
  return res.redirect(`${base}?success=true`);
};

/**
 * Trades the 90-second deep-link code for either a session or a signup token.
 * Native only; the web never calls this.
 */
export const googleExchange = async (req, res, next) => {
  const { code } = req.body;
  if (!code) return next(new AppError("Missing code", 400));

  let payload;
  try {
    payload = verifyTyped(code, "google_handoff");
  } catch {
    return next(new AppError("Sign-in link expired. Please try again.", 400));
  }

  if (payload.newUser) {
    return res.status(200).json({
      status: "newUser",
      signupToken: signSignupState(payload.googleProfile),
      profile: {
        name: payload.googleProfile?.name,
        email: payload.googleProfile?.email,
        profilePicture: payload.googleProfile?.profilePicture,
      },
    });
  }

  const user = await User.findById(payload.userId).select("-password");
  if (!user) return next(new AppError("User not found", 404));
  if (user.role === "seller") await user.populate("restaurant");

  const token = generateToken(user, res, true, { skipCookie: true });

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
  if (user.role === "courier") {
    const courierProfile = await Courier.findOne({ userId: user._id });
    if (courierProfile) response.courier = courierProfile;
  }

  return res.status(200).json({ status: "authenticated", token, user: response });
};

export const googleCompleteProfile = async (req, res, next) => {
  let googleProfile = req.session?.googleProfile;
  // Only the web has a session to clear; native carries the profile in a token.
  const fromSession = Boolean(googleProfile);

  if (!googleProfile && req.body.signupToken) {
    try {
      googleProfile = verifyTyped(req.body.signupToken, "google_signup").googleProfile;
    } catch {
      return next(
        new AppError(
          "Signup session expired. Please try signing in with Google again.",
          400,
        ),
      );
    }
  }

  if (!googleProfile) {
    return next(
      new AppError(
        "Google profile session expired. Please try signing in with Google again.",
        400,
      ),
    );
  }

  const body = req.body;
  const { role, phoneNumber, vehicleType, vehicleNumber, vehicleModel } = body;

  if (!role || !["customer", "seller", "courier"].includes(role)) {
    return next(new AppError("Valid role is required", 400));
  }

  if (await User.exists({ email: normalizeEmail(googleProfile.email) })) {
    if (fromSession) delete req.session.googleProfile;
    return next(new AppError("An account with this email already exists", 400));
  }

  if (role === "customer" && !phoneNumber) {
    return next(new AppError("Phone number is required for customers", 400));
  }

  if (role === "courier") {
    if (!phoneNumber) {
      return next(new AppError("Phone number is required for couriers", 400));
    }
    if (!vehicleType) {
      return next(new AppError("Vehicle type is required for couriers", 400));
    }

    const validVehicleTypes = ["bike", "scooter", "motorcycle", "car"];
    if (!validVehicleTypes.includes(vehicleType)) {
      return next(new AppError("Invalid vehicle type", 400));
    }
    if (!vehicleNumber) {
      return next(new AppError("Vehicle number is required", 400));
    }
    if (!vehicleModel) {
      return next(new AppError("Vehicle model is required", 400));
    }
  }

  if (role === "seller") {
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
      "restaurantDescription",
    ];

    const missing = requiredFields.find((field) => !body[field]);
    if (missing) {
      return next(new AppError(`${missing} is required`, 400));
    }

    if (
      !isValidTimeString(body.openingTime) ||
      !isValidTimeString(body.closingTime)
    ) {
      return next(
        new AppError("Operating hours must be in 24-hour HH:MM format", 400),
      );
    }

    if (
      !req.files?.restaurantImages ||
      req.files.restaurantImages.length === 0
    ) {
      return next(
        new AppError("At least one restaurant image is required", 400),
      );
    }

    const lng = parseFloat(body.restaurantLng);
    const lat = parseFloat(body.restaurantLat);

    if (isNaN(lng) || isNaN(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      return next(new AppError("Invalid coordinates", 400));
    }
  }

  const user = await User.create({
    name: googleProfile.name,
    email: googleProfile.email,
    googleId: googleProfile.googleId,
    profilePicture: googleProfile.profilePicture || "",
    authProvider: "google",
    role,
    phoneNumber: phoneNumber || undefined,
  });

  if (role === "seller") {
    const lng = parseFloat(body.restaurantLng);
    const lat = parseFloat(body.restaurantLat);

    const restaurant = await Restaurant.create({
      ownerId: user._id,
      name: body.restaurantName,
      cuisineType: body.cuisineType,
      profilePicture:
        googleProfile.profilePicture || "/defaultProfilePicture.png",
      description: body.restaurantDescription,
      images: req.files.restaurantImages.map((file) => file.path),
      phone: body.restaurantPhone,
      email: googleProfile.email.toLowerCase(),
      schedule: buildScheduleFromRange(body.openingTime, body.closingTime),
      isActive: true,
      address: {
        street: body.restaurantAddress,
        city: body.restaurantCity,
        state: body.restaurantState || "",
        zipCode: body.restaurantZipCode,
        country: "Serbia",
      },
      location: { type: "Point", coordinates: [lng, lat] },
    });

    user.restaurant = restaurant._id;
    await user.save();
    await user.populate("restaurant");

    generateToken(user, res);
    if (fromSession) delete req.session.googleProfile;

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      restaurant: user.restaurant,
    });
  }

  if (role === "courier") {
    let documents = {};
    if (body.documents) {
      try {
        documents =
          typeof body.documents === "string"
            ? JSON.parse(body.documents)
            : body.documents;
      } catch {
        documents = {};
      }
    }

    const courierProfile = await Courier.create({
      userId: user._id,
      fullName: googleProfile.name,
      phoneNumber: phoneNumber || "",
      email: googleProfile.email,
      profilePicture: googleProfile.profilePicture || "",
      vehicleType,
      vehicleNumber: vehicleNumber || "",
      vehicleModel: vehicleModel || "",
      documents: {
        driverLicense: {
          number: documents?.driverLicense?.number || "",
          expiryDate: documents?.driverLicense?.expiryDate || null,
          verified: false,
        },
        vehicleRegistration: {
          number: documents?.vehicleRegistration?.number || "",
          expiryDate: documents?.vehicleRegistration?.expiryDate || null,
          verified: false,
        },
        insurance: {
          number: documents?.insurance?.number || "",
          expiryDate: documents?.insurance?.expiryDate || null,
          verified: false,
        },
      },
      verificationStatus: "pending",
      isAvailable: true,
    });

    generateToken(user, res);
    if (fromSession) delete req.session.googleProfile;

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      courier: courierProfile,
    });
  }

  generateToken(user, res);
  if (fromSession) delete req.session.googleProfile;

  return res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
  });
};
