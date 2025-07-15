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
    type: {
      type: String,
      enum: ["buyer", "seller"],
      default: "buyer",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
