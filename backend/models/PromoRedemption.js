import mongoose from "mongoose";
import { moneySetter } from "../utils/money.js";

const promoRedemptionSchema = new mongoose.Schema(
  {
    promo: { type: mongoose.Schema.Types.ObjectId, ref: "PromoCode", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    slot: { type: Number, min: 0, required: true },
    discount: { type: Number, min: 0, required: true, set: moneySetter },
    status: { type: String, enum: ["redeemed", "released"], default: "redeemed" },
    releasedAt: Date,
  },
  { timestamps: true },
);

promoRedemptionSchema.index(
  { promo: 1, customer: 1, slot: 1 },
  { unique: true, partialFilterExpression: { status: "redeemed" } },
);
promoRedemptionSchema.index({ order: 1 }, { unique: true });
promoRedemptionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("PromoRedemption", promoRedemptionSchema);
