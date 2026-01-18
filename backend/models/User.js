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
    phoneNumber: {
      type: String,
      required: function () {
        return this.role === "customer";
      },
    },

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
