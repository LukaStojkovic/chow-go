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
    otp: String,
    isVerifiedOtp: {
      type: Boolean,
      default: false,
    },
    otpExpiry: Date,
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
