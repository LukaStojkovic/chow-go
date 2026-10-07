import mongoose from "mongoose";
import { lineTotal, moneySetter, sumMoney } from "../utils/money.js";
import { lineOptionSchema } from "./lineOption.js";

const cartItemSchema = new mongoose.Schema(
  {
    // The dish id for a plain dish, the dish id plus its option ids otherwise
    // (utils/menuOptions.js#basketLineId), so one dish can sit on two lines.
    // Lines saved before options existed have none and fall back to menuItem.
    lineId: { type: String },
    options: { type: [lineOptionSchema], default: undefined },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    /** What one portion is charged at: any promotion and every option included. */
    price: { type: Number, required: true, min: 0, set: moneySetter },
    /**
     * The undiscounted price, recorded only when a promotion was applied. Lets
     * the basket show what was struck through without re-reading the menu item,
     * whose promotion may have ended in the meantime.
     */
    basePrice: { type: Number, min: 0, set: moneySetter },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 1,
      validate: { validator: Number.isInteger, message: "Quantity must be a whole number" },
    },
    // Carried through to Order.items.specialInstructions on checkout. Notes are
    // per menu item, matching how the cart identifies a line.
    specialInstructions: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

cartItemSchema.virtual("totalPrice").get(function () {
  return lineTotal(this.price, this.quantity);
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
  { timestamps: true, versionKey: false }
);

cartSchema.virtual("totalPrice").get(function () {
  return sumMoney(...this.items.map((item) => item.totalPrice));
});

cartSchema.pre("save", function (next) {
  if (this.items.length > 0) {
    const restaurantIds = [
      ...new Set(
        this.items
          .map((item) => item.menuItem?.restaurant?.toString())
          .filter(Boolean)
      ),
    ];
    // Either side may be populated: compare ids, not a document's toString().
    const cartRestaurant = String(this.restaurant?._id ?? this.restaurant);
    if (
      restaurantIds.length > 1 ||
      (restaurantIds[0] && restaurantIds[0] !== cartRestaurant)
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
