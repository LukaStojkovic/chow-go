import mongoose from "mongoose";

// One row per logged-out access token, kept until the token would have expired
// anyway. The jti is the _id so the lookup on every request is the primary key.
const revokedTokenSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const RevokedToken = mongoose.model("RevokedToken", revokedTokenSchema);

export default RevokedToken;
