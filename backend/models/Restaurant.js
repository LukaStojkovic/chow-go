import mongoose from "mongoose";
import { lngLat } from "../utils/geoValidators.js";
import {
  DAYS_OF_WEEK,
  DEFAULT_CLOSING_TIME,
  DEFAULT_OPENING_TIME,
  TIME_PATTERN,
  DEFAULT_TIMEZONE,
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
      maxlength: 120,
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
      maxlength: 2000,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    address: {
      street: { type: String, required: true, maxlength: 200 },
      city: { type: String, required: true, maxlength: 100 },
      state: { type: String },
      zipCode: { type: String, required: true },
      country: { type: String, default: "Serbia" },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true, validate: lngLat },
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

    // isOpenNow used to be computed from the server's local clock, so a UTC
    // host put every restaurant's hours an hour or two out - and createOrder
    // rejects on that flag.
    timezone: {
      type: String,
      default: DEFAULT_TIMEZONE,
      validate: {
        validator: (value) => {
          if (!value) return false;
          try {
            new Intl.DateTimeFormat("en-US", { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        message: "{VALUE} is not a recognised IANA time zone",
      },
    },

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
    // The exact total behind averageRating, which is only ever derived from it.
    ratingSum: Number,
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
