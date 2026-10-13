import mongoose from "mongoose";
import { moneySetter } from "../utils/money.js";

// A settled weekly statement. Weeks run Monday to Sunday in the restaurant's
// zone, by delivery time; amounts are what the statement said when an admin
// recorded the transfer. Unsettled weeks are computed, never stored.
const payoutSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    weekStart: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    weekEnd: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    currency: { type: String, required: true, match: /^[A-Z]{3}$/ },
    orders: { type: Number, required: true, min: 0 },
    gross: { type: Number, required: true, set: moneySetter },
    discounts: { type: Number, required: true, set: moneySetter },
    net: { type: Number, required: true, set: moneySetter },
    reference: { type: String, required: true, maxlength: 80 },
    note: { type: String, maxlength: 300, default: "" },
    paidAt: { type: Date, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

payoutSchema.index({ restaurant: 1, weekStart: 1 }, { unique: true });
payoutSchema.index({ paidAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;
