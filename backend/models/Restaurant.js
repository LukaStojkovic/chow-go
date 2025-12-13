import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: {
    type: String,
    required: true,
  },
  price: { type: Number, required: true },
  category: {
    type: String,
    required: true,
  },
  imageUrls: [{ type: String }],
  available: { type: Boolean, default: true },
});

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
        "Fast Food",
        "Italian",
        "Chinese",
        "Indian",
        "Mexican",
        "Japanese",
        "Thai",
        "Pizza",
        "Burgers",
        "Healthy",
        "Desserts",
        "Serbian",
        "Mediterranean",
        "Other",
      ],
    },
    profilePicture: {
      type: String,
      required: true,
    },

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zipCode: { type: String, required: true },
      country: { type: String, default: "Serbia" },
    },
    coordinates: {
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

    openingTime: {
      type: String,
      required: true,
    },
    closingTime: {
      type: String,
      required: true,
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
    menuItems: [menuItemSchema],
    estimatedDeliveryTime: {
      type: String,
      default: "30-45 min",
    },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ coordinates: "2dsphere" });

restaurantSchema.index({ ownerId: 1 });

restaurantSchema.index({ isActive: 1, isOpenNow: 1 });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
