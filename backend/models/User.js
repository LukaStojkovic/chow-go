import mongoose from "mongoose";

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
    },
    password: String,
    profilePicture: String,
    otp: String,
    isVerifiedOtp: {
      type: Boolean,
      default: false,
    },
    otpExpiry: Date,

    deliveryAddresses: [
      {
        label: String,
        fullAddress: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date },
      },
    ],

    role: {
      type: String,
      enum: ["customer", "seller"],
      default: "customer",
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (this.role === "seller") {
    this.deliveryAddresses = [];
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
