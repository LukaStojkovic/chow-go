import mongoose from "mongoose";
import {
  DAYS_OF_WEEK,
  DEFAULT_CLOSING_TIME,
  DEFAULT_OPENING_TIME,
  TIME_PATTERN,
} from "../utils/schedule.js";

const dayScheduleSchema = new mongoose.Schema(
  {
    isOpen: { type: Boolean, default: true },
    openingTime: {
      type: String,
      default: DEFAULT_OPENING_TIME,
      match: [TIME_PATTERN, "openingTime must be in 24-hour HH:MM format"],
    },
    closingTime: {
      type: String,
      default: DEFAULT_CLOSING_TIME,
      match: [TIME_PATTERN, "closingTime must be in 24-hour HH:MM format"],
    },
  },
  { _id: false },
);

const weeklyScheduleFields = Object.fromEntries(
  DAYS_OF_WEEK.map((day) => [
    day,
    { type: dayScheduleSchema, default: () => ({}) },
  ]),
);

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    cuisineType: {
      type: String,
      required: true,
      enum: [
        "fast_food",
        "italian",
        "chinese",
        "indian",
        "mexican",
        "japanese",
        "thai",
        "pizza",
        "burgers",
        "healthy",
        "desserts",
        "serbian",
        "mediterranean",
      ],
    },
    profilePicture: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zipCode: { type: String, required: true },
      country: { type: String, default: "Serbia" },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    schedule: weeklyScheduleFields,

    isActive: {
      type: Boolean,
      default: false,
    },
    isOpenNow: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    estimatedDeliveryTime: {
      type: String,
      default: "30-45 min",
    },
  },
  {
    timestamps: true,
  },
);

restaurantSchema.index({ location: "2dsphere" });

restaurantSchema.index({ isActive: 1, isOpenNow: 1 });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
