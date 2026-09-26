import { createHash, randomBytes, randomInt } from "crypto";
import User from "../models/User.js";
import { env } from "../config/env.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { isMobileClient, withAuthToken } from "../utils/clientType.js";
import {
  HANDOFF_TTL_MS,
  isValidChallenge,
  mobileRedirectFor,
  readOAuthState,
  signHandoff,
  signLinkHandoff,
  signLinkTicket,
  signSignupState,
  verifierMatches,
  verifyTyped,
} from "../utils/googleHandoff.js";
import ConsumedHandoff from "../models/ConsumedHandoff.js";
import jwt from "jsonwebtoken";
import { extractToken } from "../middlewares/authMiddleware.js";
import { revokeToken } from "../utils/revokedTokens.js";
import { disconnectUserSockets } from "../socket/socketServer.js";
import { logger } from "../utils/logger.js";
import { sendOtpEmail } from "../utils/mail.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";
import { deleteAccountOperation } from "../services/accountDeletion.service.js";
import { exportAccountData } from "../services/accountExport.service.js";
import { linkGoogleAccount } from "../services/googleLink.service.js";
import {
  buildScheduleFromRange,
  isValidTimeString,
} from "../utils/schedule.js";


const OTP_TTL_MS = 5 * 60 * 1000;
const RESET_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_OTP_REQUESTS = 3;
const OTP_REQUEST_WINDOW_MS = 60 * 60 * 1000;

// Compared against when there is no password to check, so an unknown email or
// a Google-only account costs the same bcrypt round as a wrong password.
const TIMING_HASH = bcrypt.hashSync(randomBytes(16).toString("hex"), 12);

// User.email is unique but not lowercased, while Restaurant.email is - so
// "A@b.com" and "a@b.com" could become two accounts and a user who signed up
// with capitals could not log in typing lowercase.
function normalizeEmail(value) {
  return String(value).trim().toLowerCase();
}

function initialRestaurantStatus() {
  return env.restaurantApprovalRequired
    ? { isActive: false, approvalStatus: "pending" }
    : { isActive: true, approvalStatus: "approved" };
}

const suspendedError = () =>
  new AppError("errors:auth.accountSuspended", 403, "ACCOUNT_SUSPENDED");

// googleId itself stays server-side; clients only need to know whether one is
// linked and whether the account has a password of its own.
function publicUser(user) {
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt,
    authProvider: user.authProvider,
    googleLinked: Boolean(user.googleId),
    isAdmin: user.isAdmin === true,
  };
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

  if (typeof email !== "string" || typeof password !== "string") {
    return next(new AppError("errors:auth.invalidCredentials", 400, "INVALID_CREDENTIALS"));
  }

  const user = await User.findOne({ email: normalizeEmail(email), isDeleted: { $ne: true } });

  // One answer and one bcrypt round for every failure: "Please login with
  // Google" and an early return for unknown emails each told an attacker which
  // addresses have accounts.
  const isCorrectPassword = await bcrypt.compare(password, user?.password || TIMING_HASH);
  if (!user?.password || !isCorrectPassword) {
    return next(new AppError("errors:auth.invalidCredentials", 400, "INVALID_CREDENTIALS"));
  }
  // Only after the password check, so it never tells a stranger the account exists.
  if (user.suspendedAt) return next(suspendedError());

  const token = generateToken(user, res, !!rememberMe || isMobileClient(req));

  if (user.role === "seller") {
    await user.populate("restaurant");
  }

  const response = {
    ...publicUser(user),
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

// The user is created before its restaurant or courier profile. If that second
// create throws, the half-made user kept the email "in use" and the person
// could never sign up again.
async function createOrRollback(userId, create) {
  try {
    return await create();
  } catch (error) {
    await User.deleteOne({ _id: userId });
    throw error;
  }
}

export const register = async (req, res, next) => {
  const { email, name, password, role, phoneNumber } = req.body;

  if (!email || !name || !password || !role) {
    return next(new AppError("Missing required fields", 400));
  }

  if (role === "customer" && !phoneNumber) {
    return next(new AppError("Phone number is required for customers", 400));
  }

  // Only a seller signup stores these; on any other role they would upload,
  // succeed, and never be referenced by anything.
  if (role !== "seller" && req.files?.restaurantImages?.length) {
    return next(new AppError("Restaurant images are only accepted for sellers", 400, "UNEXPECTED_UPLOAD"));
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

    const restaurant = await createOrRollback(user._id, () => Restaurant.create({
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
      ...initialRestaurantStatus(),
      address: {
        street: sellerData.restaurantAddress,
        city: sellerData.restaurantCity,
        state: sellerData.restaurantState || "",
        zipCode: sellerData.restaurantZipCode,
        country: "Serbia",
      },
      location: { type: "Point", coordinates: [lng, lat] },
    }));

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

    const courierProfile = await createOrRollback(user._id, () => Courier.create({
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
    }));

    const courierToken = generateToken(user, res, isMobileClient(req));

    return res.status(201).json(
      withAuthToken(
        req,
        {
          ...publicUser(user),
          courier: courierProfile,
        },
        courierToken,
      ),
    );
  }

  const token = generateToken(user, res, isMobileClient(req));

  const response = {
    ...publicUser(user),
  };

  if (user.role === "seller" && user.restaurant) {
    response.restaurant = user.restaurant;
  }

  return res.status(201).json(withAuthToken(req, response, token));
};

export async function logout(req, res) {
  // Public route: an expired or garbage token still gets its cookie cleared.
  const token = extractToken(req);
  if (token) {
    let decoded = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {}
    if (decoded?.typ === "access" || (decoded && !decoded.typ)) {
      await revokeToken(decoded);
      if (decoded.jti) disconnectUserSockets(decoded.userId, { jti: decoded.jti });
    }
  }

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

  const body = {
    status: "success",
    message: "Profile updated successfully",
    data: { ...updatedUser.toJSON(), ...publicUser(updatedUser), googleId: undefined },
  };

  if (updateData.tokenVersion === undefined) return res.status(200).json(body);

  // Every other device is signed out; this one gets a fresh token at the new
  // version instead of being logged out by its own password change, and keeps
  // its socket, which the client would not reconnect after a server kick.
  disconnectUserSockets(userId, { exceptJti: req.tokenJti });
  const rememberMe =
    isMobileClient(req) ||
    (Boolean(req.tokenExp) && req.tokenExp * 1000 - Date.now() > 7 * 24 * 60 * 60 * 1000);
  const token = generateToken(updatedUser, res, rememberMe);
  return res.status(200).json(withAuthToken(req, body, token));
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return next(new AppError("Email is required", 400, "EMAIL_REQUIRED"));
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select("_id");

  // Deliberately uniform, in body and in timing: "User not found" told an
  // attacker which addresses have accounts, and so did a response that waited
  // on bcrypt and SMTP only for real ones. The work happens after replying.
  res.status(200).json({
    status: "success",
    message: "If that email has an account, a reset code is on its way.",
  });

  if (user) {
    issueResetCode(user._id).catch((error) =>
      logger.error({ err: error }, "Failed to issue a password reset code"),
    );
  }
};

async function claimResetCodeSlot(userId) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - OTP_REQUEST_WINDOW_MS);
  const fresh = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [{ otpWindowStart: { $exists: false } }, { otpWindowStart: { $lt: windowStart } }],
    },
    { $set: { otpWindowStart: now, otpRequestCount: 1 } },
  );
  if (fresh) return true;
  const counted = await User.findOneAndUpdate(
    { _id: userId, otpRequestCount: { $lt: MAX_OTP_REQUESTS } },
    { $inc: { otpRequestCount: 1 } },
  );
  return Boolean(counted);
}

async function issueResetCode(userId) {
  if (!(await claimResetCodeSlot(userId))) return;

  // crypto.randomInt, not Math.random - a predictable PRNG over a 10^6 space
  // is guessable.
  const otpCode = String(randomInt(100000, 1000000));
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        otpHash: await bcrypt.hash(otpCode, 10),
        otpExpiry: new Date(Date.now() + OTP_TTL_MS),
        otpAttempts: 0,
      },
      $unset: { resetTokenHash: 1, resetTokenExpiry: 1 },
    },
    { new: true },
  ).select("email");

  if (user) await sendOtpEmail(user.email, otpCode);
}

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
  disconnectUserSockets(user._id);

  res.status(200).json({
    status: "success",
    message: "Password reset successfully. Sign in with your new password.",
  });
}

/**
 * Required by App Store Review Guideline 5.1.1(v) for any app that lets people
 * create an account, and by GDPR regardless of the stores.
 */
export async function exportAccount(req, res) {
  const data = await exportAccountData(req.user._id);
  const day = data.exportedAt.slice(0, 10);
  res.set("Content-Disposition", `attachment; filename="chowgo-data-${day}.json"`);
  res.set("Cache-Control", "no-store");
  res.status(200).json(data);
}

export async function deleteAccount(req, res, next) {
  await deleteAccountOperation({ user: req.user, password: req.body?.password });
  disconnectUserSockets(req.user._id);

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
    ...publicUser(req.user),
  };

  if (req.user.role === "seller" && req.user.restaurant) {
    response.restaurant = req.user.restaurant;
  }

  if (req.user.role === "courier" && req.user.courier) {
    response.courier = req.user.courier;
  }

  res.status(200).json(response);
};

const GOOGLE_FAILURE_REASONS = new Set(["account_exists", "email_unverified", "account_suspended"]);

export const googleCallback = async (req, res, next) => {
  const data = req.user;
  const state = readOAuthState(req.query.state);
  const isMobile = state.client === "mobile";
  const base = isMobile
    ? mobileRedirectFor(state.redirect)
    : `${process.env.FRONTEND_URL}/auth/google/callback`;

  if (state.link) {
    const googleId = data?.linkProfile?.googleId;
    if (isMobile) {
      if (!googleId || !isValidChallenge(state.challenge)) {
        return res.redirect(`${base}?linkError=auth_failed`);
      }
      const code = signLinkHandoff({ link: state.link, googleId }, state.challenge);
      return res.redirect(`${base}?linkCode=${encodeURIComponent(code)}`);
    }
    if (!googleId) return res.redirect(`${base}?linkError=auth_failed`);
    const { failure } = await linkGoogleAccount(state.link, googleId);
    return res.redirect(failure ? `${base}?linkError=${failure}` : `${base}?linked=true`);
  }

  if (data?.suspendedAt) return res.redirect(`${base}?error=account_suspended`);

  if (!data) {
    const reason = GOOGLE_FAILURE_REASONS.has(req.googleAuthFailure)
      ? req.googleAuthFailure
      : "auth_failed";
    return res.redirect(`${base}?error=${reason}`);
  }

  if (isMobile) {
    if (!isValidChallenge(state.challenge)) {
      return res.redirect(`${base}?error=auth_failed`);
    }
    // One opaque parameter for both cases: the app does not branch until after
    // the exchange, which keeps the deep-link surface as small as possible.
    const code = data.isNewUser
      ? signHandoff({ newUser: true, googleProfile: data.googleProfile }, state.challenge)
      : signHandoff({ newUser: false, userId: String(data._id) }, state.challenge);

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
  const { code, codeVerifier } = req.body;
  if (typeof code !== "string" || !code) return next(new AppError("Missing code", 400));

  let payload;
  try {
    payload = verifyTyped(code, "google_handoff");
  } catch {
    return next(new AppError("Sign-in link expired. Please try again.", 400));
  }

  if (!payload.jti || !verifierMatches(codeVerifier, payload.challenge)) {
    return next(
      new AppError("Sign-in could not be verified. Please try again.", 400, "HANDOFF_INVALID"),
    );
  }

  try {
    await ConsumedHandoff.create({
      _id: payload.jti,
      expiresAt: new Date(Date.now() + HANDOFF_TTL_MS),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(
        new AppError("This sign-in link was already used. Please try again.", 400, "HANDOFF_USED"),
      );
    }
    throw error;
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
  if (user.suspendedAt) return next(suspendedError());
  if (user.role === "seller") await user.populate("restaurant");

  const token = generateToken(user, res, true, { skipCookie: true });

  const response = {
    ...publicUser(user),
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

const LINK_FAILURE_ERRORS = {
  link_expired: ["errors:auth.googleLinkExpired", 400, "GOOGLE_LINK_EXPIRED"],
  already_linked: ["errors:auth.googleAlreadyLinked", 409, "GOOGLE_ALREADY_LINKED"],
  google_in_use: ["errors:auth.googleInUse", 409, "GOOGLE_IN_USE"],
};

/** Native: trades the bearer session for a ticket the system browser can carry. */
export const googleLinkTicket = async (req, res, next) => {
  const { challenge, redirect } = req.body ?? {};
  if (!isValidChallenge(challenge)) return next(new AppError("Invalid challenge", 400));
  if (req.user.googleId) {
    return next(new AppError("errors:auth.googleAlreadyLinked", 409, "GOOGLE_ALREADY_LINKED"));
  }
  const ticket = signLinkTicket(
    { userId: req.user._id, ver: req.user.tokenVersion ?? 0 },
    challenge,
    mobileRedirectFor(redirect),
  );
  return res.status(200).json({ ticket });
};

/** Native: completes a link once the app proves it started it. */
export const googleLinkConfirm = async (req, res, next) => {
  const { code, codeVerifier } = req.body ?? {};
  let payload;
  try {
    payload = verifyTyped(String(code ?? ""), "google_link_handoff");
  } catch {
    return next(new AppError("Link expired. Please try again.", 400, "HANDOFF_INVALID"));
  }
  if (
    !payload.jti ||
    !verifierMatches(codeVerifier, payload.challenge) ||
    payload.link?.userId !== String(req.user._id)
  ) {
    return next(new AppError("Link could not be verified. Please try again.", 400, "HANDOFF_INVALID"));
  }

  try {
    await ConsumedHandoff.create({
      _id: payload.jti,
      expiresAt: new Date(Date.now() + HANDOFF_TTL_MS),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError("This link was already used. Please try again.", 400, "HANDOFF_USED"));
    }
    throw error;
  }

  const { failure } = await linkGoogleAccount(payload.link, payload.googleId);
  if (failure) {
    const [key, status, errorCode] = LINK_FAILURE_ERRORS[failure];
    return next(new AppError(key, status, errorCode));
  }
  return res.status(200).json({ linked: true });
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

  if (role !== "seller" && req.files?.restaurantImages?.length) {
    return next(new AppError("Restaurant images are only accepted for sellers", 400, "UNEXPECTED_UPLOAD"));
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

    const restaurant = await createOrRollback(user._id, () => Restaurant.create({
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
      ...initialRestaurantStatus(),
      address: {
        street: body.restaurantAddress,
        city: body.restaurantCity,
        state: body.restaurantState || "",
        zipCode: body.restaurantZipCode,
        country: "Serbia",
      },
      location: { type: "Point", coordinates: [lng, lat] },
    }));

    user.restaurant = restaurant._id;
    await user.save();
    await user.populate("restaurant");

    const token = generateToken(user, res, isMobileClient(req));
    if (fromSession) delete req.session.googleProfile;

    return res.status(201).json(withAuthToken(req, {
      ...publicUser(user),
      restaurant: user.restaurant,
    }, token));
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

    const courierProfile = await createOrRollback(user._id, () => Courier.create({
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
    }));

    const token = generateToken(user, res, isMobileClient(req));
    if (fromSession) delete req.session.googleProfile;

    return res.status(201).json(withAuthToken(req, {
      ...publicUser(user),
      courier: courierProfile,
    }, token));
  }

  const token = generateToken(user, res, isMobileClient(req));
  if (fromSession) delete req.session.googleProfile;

  return res.status(201).json(withAuthToken(req, {
    ...publicUser(user),
  }, token));
};
