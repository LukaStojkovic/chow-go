import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["customer", "seller", "courier"],
      required: true,
    },

    type: {
      type: String,
      enum: [
        "order_placed",
        "order_confirmed",
        "order_preparing",
        "order_ready",
        "order_assigned",
        "order_picked_up",
        "order_in_transit",
        "order_delivered",
        "order_cancelled",
        "order_rejected",
        "payment_received",
        "rating_received",
      ],
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    data: mongoose.Schema.Types.Mixed,

    isRead: { type: Boolean, default: false },
    readAt: Date,

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
