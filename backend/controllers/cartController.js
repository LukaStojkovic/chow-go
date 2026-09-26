import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import { AppError } from "../utils/AppError.js";
import { effectivePrice } from "../utils/promotion.js";
import { repriceCartLines } from "../services/cartPricing.service.js";

export const MAX_LINE_QUANTITY = 50;

// Quantities arrived unchecked: 1.5 and 1e6 were stored as-is, and a string
// "5" added to an existing 1 concatenated to "15".
export function parseQuantity(value, { min }) {
  const number =
    typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isInteger(number) && number >= min && number <= MAX_LINE_QUANTITY ? number : null;
}

const quantityError = () =>
  new AppError("errors:cart.quantityInvalid", 400, "QUANTITY_INVALID", { max: MAX_LINE_QUANTITY });

export async function getCart(req, res, next) {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate("items.menuItem")
    .populate("restaurant");

  if (!cart) {
    return res.status(200).json({
      status: "success",
      data: {
        items: [],
        totalPrice: 0,
        restaurant: null,
      },
    });
  }

  // The basket shows what checkout will charge, so the PRICE_CHANGED refusal
  // there only happens when a price moves between viewing and ordering.
  const { changes } = repriceCartLines(cart);
  if (changes.length > 0) await cart.save();

  res.status(200).json({
    status: "success",
    data: cart,
    ...(changes.length > 0 ? { priceChanges: changes } : {}),
  });
}

export async function addToCart(req, res, next) {
  const { menuItemId, specialInstructions } = req.body;
  const quantity = parseQuantity(req.body.quantity ?? 1, { min: 1 });

  if (!menuItemId) {
    return next(new AppError("Menu item ID is required", 400));
  }
  if (quantity === null) return next(quantityError());

  const menuItem = await MenuItem.findOne({ _id: menuItemId, deletedAt: null }).populate("restaurant");

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }
  if (!menuItem.available) {
    return next(
      new AppError("errors:order.itemUnavailable", 400, "ITEM_UNAVAILABLE", { name: menuItem.name }),
    );
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (
    cart &&
    cart.items.length > 0 &&
    cart.restaurant.toString() !== menuItem.restaurant._id.toString()
  ) {
    return next(
      new AppError(
        "You can only add items from one restaurant. Clear cart first.",
        400
      )
    );
  }

  if (cart && cart.items.length === 0) {
    cart.restaurant = menuItem.restaurant._id;
  }

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      restaurant: menuItem.restaurant._id,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.menuItem.toString() === menuItemId
  );

  if (existingItem) {
    if (existingItem.quantity + quantity > MAX_LINE_QUANTITY) return next(quantityError());
    existingItem.quantity += quantity;
    const unitPrice = effectivePrice(menuItem.price, menuItem.promotion);
    existingItem.price = unitPrice;
    existingItem.basePrice = unitPrice < menuItem.price ? menuItem.price : undefined;
    // A note supplied on a later add replaces the line's note; sending none
    // leaves whatever was already there untouched.
    if (specialInstructions !== undefined) {
      existingItem.specialInstructions = specialInstructions;
    }
  } else {
    // Priced from the menu item, never from the client. getCart and checkout
    // bring it back to the current price if the menu changes afterwards.
    const unitPrice = effectivePrice(menuItem.price, menuItem.promotion);

    cart.items.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: unitPrice,
      basePrice: unitPrice < menuItem.price ? menuItem.price : undefined,
      quantity,
      specialInstructions,
    });
  }

  await cart.save();
  await cart.populate(["items.menuItem", "restaurant"]);

  res.status(200).json({
    status: "success",
    data: cart,
  });
}

export const removeItemFromCart = async (req, res, next) => {
  const { menuItemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.items = cart.items.filter(
    (item) => item.menuItem.toString() !== menuItemId
  );

  await cart.save();

  await cart.populate(["items.menuItem", "restaurant"]);

  res.status(200).json({
    status: "success",
    data: cart,
  });
};

export const clearCart = async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    status: "success",
    data: cart,
  });
};

export const updateCartItemQuantity = async (req, res, next) => {
  const { menuItemId } = req.params;
  const { specialInstructions } = req.body;
  const quantity = parseQuantity(req.body.quantity, { min: 0 });

  if (quantity === null) return next(quantityError());

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  const item = cart.items.find(
    (item) => item.menuItem.toString() === menuItemId
  );

  if (!item) {
    return next(new AppError("Item not found in cart", 404));
  }

  if (quantity === 0) {
    cart.items = cart.items.filter(
      (item) => item.menuItem.toString() !== menuItemId
    );
  } else {
    item.quantity = quantity;
    if (specialInstructions !== undefined) {
      item.specialInstructions = specialInstructions;
    }
  }

  await cart.save();

  await cart.populate(["items.menuItem", "restaurant"]);

  res.status(200).json({
    status: "success",
    data: cart,
  });
};
