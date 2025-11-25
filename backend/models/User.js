import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      unique: true,
      type: String,
      required: true,
    },
    password: String,
    profilePicture: String,
    otp: String,
    isVerifiedOtp: {
      type: Boolean,
      default: false,
    },
    otpExpiry: Date,

    role: {
      type: String,
      enum: ["customer", "seller"],
      default: "customer",
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
