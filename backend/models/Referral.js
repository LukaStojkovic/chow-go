import mongoose from "mongoose";

// One row per invited customer. `referred` is unique, so an account can only
// ever be referred once, and the status moves pending -> rewarded exactly once
// through a conditional update when the friend's first order is delivered.
const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    code: { type: String, required: true },
    status: { type: String, enum: ["pending", "rewarded", "capped"], default: "pending" },
    friendVoucher: { type: mongoose.Schema.Types.ObjectId, ref: "PromoCode" },
    referrerVoucher: { type: mongoose.Schema.Types.ObjectId, ref: "PromoCode" },
    rewardedAt: Date,
  },
  { timestamps: true },
);

referralSchema.index({ referrer: 1, status: 1, rewardedAt: -1 });

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
