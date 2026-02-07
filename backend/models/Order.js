import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    specialInstructions: { type: String },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    courier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Addresses",
      required: true,
    },
    deliveryAddressSnapshot: {
      label: String,
      fullAddress: String,
      buildingName: String,
      apartment: String,
      floor: String,
      entrance: String,
      doorCode: String,
      notes: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number],
      },
    },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    tip: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
        "rejected",
      ],
      default: "pending",
      required: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
      required: true,
    },
    transactionId: String,

    customerNotes: String,
    restaurantNotes: String,
    courierNotes: String,

    estimatedPreparationTime: Number,
    estimatedDeliveryTime: Date,
    confirmedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    assignedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    rejectedAt: Date,

    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["customer", "restaurant", "courier", "admin"],
    },
    rejectionReason: String,

    customerRating: {
      restaurantRating: { type: Number, min: 1, max: 5 },
      courierRating: { type: Number, min: 1, max: 5 },
      restaurantReview: String,
      courierReview: String,
      ratedAt: Date,
    },

    isScheduled: { type: Boolean, default: false },
    scheduledFor: Date,
    deviceInfo: {
      platform: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ courier: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "deliveryAddressSnapshot.location": "2dsphere" });

orderSchema.pre("validate", async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const count = await this.constructor.countDocuments();
      const timestamp = Date.now();
      const orderNum = String(count + 1).padStart(5, "0");
      this.orderNumber = `ORD-${timestamp}-${orderNum}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

orderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;
