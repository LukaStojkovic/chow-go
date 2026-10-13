import mongoose from "mongoose";
import { COLLECTION_KINDS, COLLECTION_LIMITS, COLLECTION_STATUSES } from "@chowgo/shared/collections";

// An editorial rail on the discovery home ("Best burgers", "Under 500 RSD").
// Rules are evaluated against what is near the viewer at read time; pins are
// shown first, or alone when manualOnly is set.
const collectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, maxlength: COLLECTION_LIMITS.slugLength, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    kind: { type: String, enum: COLLECTION_KINDS, required: true },
    title: { type: Map, of: String, required: true },
    subtitle: { type: Map, of: String, default: {} },
    coverImage: { type: String, default: null },
    status: { type: String, enum: COLLECTION_STATUSES, default: "draft", index: true },
    position: { type: Number, default: 0 },
    manualOnly: { type: Boolean, default: false },
    pins: [{ type: mongoose.Schema.Types.ObjectId }],
    maxItems: { type: Number, min: COLLECTION_LIMITS.minItems, max: COLLECTION_LIMITS.maxItems, default: COLLECTION_LIMITS.defaultItems },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    rules: {
      cuisines: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      minRating: { type: Number, default: null },
      maxPrice: { type: Number, default: null },
      currency: { type: String, default: null },
      onlyDeals: { type: Boolean, default: false },
      openNow: { type: Boolean, default: false },
      newWithinDays: { type: Number, default: null },
      sort: { type: String, required: true },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

collectionSchema.index({ status: 1, position: 1 });

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
