import mongoose from "mongoose";

const courierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    profilePicture: String,

    vehicleType: {
      type: String,
      enum: ["bike", "scooter", "motorcycle", "car"],
      required: true,
    },
    vehicleNumber: String,
    vehicleModel: String,

    documents: {
      driverLicense: {
        number: String,
        expiryDate: Date,
        verified: { type: Boolean, default: false },
      },
      vehicleRegistration: {
        number: String,
        expiryDate: Date,
        verified: { type: Boolean, default: false },
      },
      insurance: {
        number: String,
        expiryDate: Date,
        verified: { type: Boolean, default: false },
      },
    },

    isActive: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    lastLocationUpdate: Date,

    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    workingHours: {
      monday: { start: String, end: String, isWorking: Boolean },
      tuesday: { start: String, end: String, isWorking: Boolean },
      wednesday: { start: String, end: String, isWorking: Boolean },
      thursday: { start: String, end: String, isWorking: Boolean },
      friday: { start: String, end: String, isWorking: Boolean },
      saturday: { start: String, end: String, isWorking: Boolean },
      sunday: { start: String, end: String, isWorking: Boolean },
    },

    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
  },
  { timestamps: true },
);

courierSchema.index({ currentLocation: "2dsphere" });
courierSchema.index({ isOnline: 1, isAvailable: 1 });

const Courier = mongoose.model("Courier", courierSchema);

export default Courier;
