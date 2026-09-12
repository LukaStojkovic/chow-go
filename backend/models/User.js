import mongoose from "mongoose";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@chowgo/shared/i18n/config";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      unique: true,
      type: String,
      required: true,
      // Restaurant.email already did this; User did not, so "A@b.com" and
      // "a@b.com" were two accounts and a lookup had to guess the casing.
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profilePicture: String,

    // The reset code was stored in cleartext with no select:false, so
    // updateProfile (.select("-password")) returned the live OTP in its
    // response body. It is hashed and hidden now, and the attempt counter
    // closes the brute-force window that a 6-digit code otherwise leaves open.
    otpHash: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },

    // verifyOtp used to set a sticky isVerifiedOtp boolean with no expiry, so a
    // verified reset window stayed open forever and resetPassword needed only
    // an email to use it. It now issues a single-use, short-lived token.
    resetTokenHash: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },

    // Bumped on password reset and password change. Access tokens carry the
    // version they were minted at, so raising it invalidates every credential
    // already issued - there was previously no way to revoke anything.
    tokenVersion: { type: Number, default: 0 },

    // The language this person reads the app in. Stored, not derived, because
    // the backend has to render push notification copy long after the request
    // that would have carried a header - a courier is assigned while the
    // customer's app is closed. Clients set it at sign-in and whenever the
    // user switches; `SUPPORTED_LOCALES` is the enum so a typo cannot write a
    // value `resolveLocale` would silently fall back from on every send.
    locale: {
      type: String,
      enum: SUPPORTED_LOCALES,
      default: DEFAULT_LOCALE,
    },

    // A deleted account is anonymised rather than removed: orders are the
    // restaurant's and the courier's records too, and a hard delete would tear
    // holes in their history. See services/accountDeletion.service.js.
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    phoneNumber: {
      type: String,
      required: function () {
        return this.role === "customer";
      },
    },

    role: {
      type: String,
      enum: ["customer", "seller", "courier"],
      default: "customer",
      required: true,
    },
    favouriteRestaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
      },
    ],
  },
  { timestamps: true },
);

userSchema.pre("save", function (next) {
  if (this.role === "seller") {
    this.deliveryAddresses = [];
  }
  next();
});

// select: false matters - toJSON runs with virtuals on, so without it every
// device token would ride along in checkAuth and login responses.
userSchema.add({
  pushTokens: {
    type: [
      new mongoose.Schema(
        {
          token: { type: String, required: true },
          platform: { type: String, enum: ["ios", "android"], required: true },
          deviceId: String,
          lastSeenAt: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
    ],
    default: [],
    select: false,
  },
});

userSchema.index({ "pushTokens.token": 1 });

userSchema.virtual("restaurant", {
  ref: "Restaurant",
  localField: "_id",
  foreignField: "ownerId",
});

userSchema.virtual("addresses", {
  ref: "Addresses",
  localField: "_id",
  foreignField: "userId",
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
