import mongoose from "mongoose";
import {
  MAX_PERCENTAGE_OFF,
  MAX_PROMOTION_LABEL,
  PROMOTION_TYPES,
} from "../utils/promotion.js";

/**
 * A seller-authored price reduction on a single dish.
 *
 * `isActive` is the switch; `startsAt`/`endsAt` are optional, and when present
 * they close the promotion without the seller having to come back and turn it
 * off. `utils/promotion.js` owns every rule about what the fields mean - the
 * schema only guards the ranges.
 */
const promotionSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: PROMOTION_TYPES, default: "percentage" },
    /** Percent off for `percentage`, currency off for `fixed`. */
    value: { type: Number, default: 0, min: 0, max: 100000 },
    /** Optional seller copy shown on the badge, e.g. "Weekend deal". */
    label: { type: String, trim: true, maxlength: MAX_PROMOTION_LABEL, default: "" },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { _id: false },
);

promotionSchema.path("value").validate(function (value) {
  if (this.type !== "percentage") return true;
  return value <= MAX_PERCENTAGE_OFF;
}, `A percentage promotion cannot exceed ${MAX_PERCENTAGE_OFF}%`);

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    imageUrls: [{ type: String }],
    available: { type: Boolean, default: true },

    promotion: { type: promotionSchema, default: () => ({}) },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, createdAt: -1 });

// Backs the promotions rail on discovery: "every live deal near this address"
// is a query on these two fields plus a restaurant filter.
menuItemSchema.index({ "promotion.isActive": 1, available: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;
