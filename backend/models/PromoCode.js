import mongoose from "mongoose";
import { PROMO_LIMITS, PROMO_STATUSES, PROMO_TYPES } from "@chowgo/shared/promoCode";
import { CURRENCY_CODE, moneySetter } from "../utils/money.js";

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: PROMO_LIMITS.minCodeLength,
      maxlength: PROMO_LIMITS.maxCodeLength,
      match: /^[A-Z0-9-]+$/,
    },
    label: { type: String, trim: true, maxlength: PROMO_LIMITS.maxLabelLength, default: "" },
    scope: { type: String, enum: ["platform", "restaurant"], required: true },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required() {
        return this.scope === "restaurant";
      },
    },
    restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
    type: { type: String, enum: PROMO_TYPES, required: true },
    value: { type: Number, min: 0, default: 0 },
    maxDiscount: { type: Number, min: 0, set: moneySetter },
    minSubtotal: { type: Number, min: 0, default: 0, set: moneySetter },
    currency: { type: String, default: CURRENCY_CODE, match: /^[A-Z]{3}$/ },
    startsAt: Date,
    endsAt: Date,
    maxRedemptions: { type: Number, min: 1 },
    perCustomerLimit: { type: Number, min: 1, default: 1 },
    firstOrderOnly: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sourceOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    redemptionCount: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: PROMO_STATUSES, default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

promoCodeSchema.index({ code: 1 }, { unique: true });
promoCodeSchema.index({ scope: 1, restaurant: 1, status: 1, createdAt: -1 });
promoCodeSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model("PromoCode", promoCodeSchema);
