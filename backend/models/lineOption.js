import mongoose from "mongoose";
import { moneySetter } from "../utils/money.js";

// An option as chosen on a basket or order line. Copied, not referenced, so an
// order still reads "Large, Extra cheese" after the seller renames or deletes
// the option.
export const lineOptionSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    groupName: { type: String, required: true },
    optionId: { type: String, required: true },
    name: { type: String, required: true },
    priceDelta: { type: Number, default: 0, min: 0, set: moneySetter },
  },
  { _id: false },
);
