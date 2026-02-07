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
  { timestamps: true },
);

addressSchema.index({ location: "2dsphere" });

addressSchema.pre("save", async function (next) {
  if (this.isDeleted) return next();

  const count = await this.constructor.countDocuments({
    userId: this.userId,
    isDeleted: false,
    _id: { $ne: this._id },
  });

  if (count >= 5) {
    return next(
      new Error(
        "Maximum 5 delivery addresses allowed per user. Delete one to add new.",
      ),
    );
  }

  next();
});

const Addresses = mongoose.model("Addresses", addressSchema);

export default Addresses;
