import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    label: { type: String, required: true },

    addressType: {
      type: String,
      enum: ["apartment", "house", "office", "hotel", "other"],
      required: true,
    },

    fullAddress: { type: String, required: true },

    buildingName: String,
    apartment: String,
    floor: String,
    entrance: String,
    doorCode: String,
    notes: String,

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    lastUsedAt: Date,
  },
  { timestamps: true }
);

addressSchema.index({ location: "2dsphere" });

const Addresses = mongoose.model("Addresses", addressSchema);

export default Addresses;
