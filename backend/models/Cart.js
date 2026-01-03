import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

cartItemSchema.virtual("totalPrice").get(function () {
  return this.price * this.quantity;
});

const cartSchema = new mongoose.Schema(
  {
    user: {
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
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true },
  { versionKey: false }
);

cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce((total, item) => total + item.totalPrice, 0);
});

cartSchema.pre("save", function (next) {
  if (this.items.length > 0) {
    const restaurantIds = [
      ...new Set(
        this.items.map((item) => item.menuItem.restaurant?.toString())
      ),
    ];
    if (
      restaurantIds.length > 1 ||
      (restaurantIds[0] && restaurantIds[0] !== this.restaurant.toString())
    ) {
      return next(new Error("All items must belong to the same restaurant"));
    }
  }
  next();
});

cartSchema.index({ user: 1, restaurant: 1 }, { unique: true });
cartSchema.index({ restaurant: 1, createdAt: -1 });

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
