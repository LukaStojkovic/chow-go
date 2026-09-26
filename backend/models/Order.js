import mongoose from "mongoose";
import { CURRENCY_CODE, moneySetter } from "../utils/money.js";
import { randomBytes } from "crypto";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0, set: moneySetter },
    quantity: { type: Number, required: true, min: 1 },
    specialInstructions: { type: String, maxlength: 200 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      // unique already builds an index; declaring both produced a duplicate
      // index warning on every boot.
      type: String,
      unique: true,
    },

    // Set from an Idempotency-Key header. A double-tap on Place Order, or a
    // client retry after a slow response, used to create two real orders.
    idempotencyKey: {
      type: String,
      maxlength: 128,
      select: false,
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
      ref: "Courier",
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

    // Every amount is a whole number of cents in `currency`; the setters make
    // that true whatever arithmetic produced the value.
    currency: { type: String, default: CURRENCY_CODE, match: /^[A-Z]{3}$/ },
    subtotal: { type: Number, required: true, min: 0, set: moneySetter },
    deliveryFee: { type: Number, required: true, min: 0, default: 0, set: moneySetter },
    // serviceFee was passed to this constructor and silently dropped, so
    // subtotal + deliveryFee + tax + tip never reconciled with total and
    // platform revenue was recorded nowhere. priorityFee used to be folded
    // into deliveryFee, which made the stored order itemise differently from
    // the checkout screen that produced it.
    serviceFee: { type: Number, required: true, min: 0, default: 0, set: moneySetter },
    priorityFee: { type: Number, required: true, min: 0, default: 0, set: moneySetter },
    tax: { type: Number, required: true, min: 0, default: 0, set: moneySetter },
    tip: { type: Number, min: 0, default: 0, set: moneySetter },
    discount: { type: Number, min: 0, default: 0, set: moneySetter },
    total: { type: Number, required: true, min: 0, set: moneySetter },

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
      // Both are collected by the courier on delivery - "card" means a card
      // terminal at the door, not an online charge. "wallet" was in this enum
      // with no UI offering it and nothing implementing it.
      type: String,
      enum: ["cash", "card"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
      required: true,
    },
    transactionId: String,

    customerNotes: { type: String, maxlength: 500 },
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
// Unique per customer, not globally: a global index let one account's key
// collide with another's and answer 409 for an order it never placed. The
// old single-field index is dropped by scripts/migrateIdempotencyIndex.js.
orderSchema.index(
  { customer: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } },
);
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ courier: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
// The courier pool's $geoNear filters on status and courier; leading with
// them keeps it from walking every delivered order near the courier. The
// pool query names its key, so the old single-field index can coexist until
// scripts/migrateOrderGeoIndex.js drops it.
orderSchema.index({ status: 1, courier: 1, "deliveryAddressSnapshot.location": "2dsphere" });

orderSchema.pre("validate", function (next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;
  }
  next();
});

orderSchema.virtual("totalItems").get(function () {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;
