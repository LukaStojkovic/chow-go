import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import { AppError } from "../utils/AppError.js";
import { effectivePrice } from "../utils/promotion.js";

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

  res.status(200).json({
    status: "success",
    data: cart,
  });
}

export async function addToCart(req, res, next) {
  const { menuItemId, quantity = 1, specialInstructions } = req.body;

  if (!menuItemId) {
    return next(new AppError("Menu item ID is required", 400));
  }

  const menuItem = await MenuItem.findById(menuItemId).populate("restaurant");

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
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
    existingItem.quantity += quantity;
    // A note supplied on a later add replaces the line's note; sending none
    // leaves whatever was already there untouched.
    if (specialInstructions !== undefined) {
      existingItem.specialInstructions = specialInstructions;
    }
  } else {
    // Priced from the menu item at the moment it is added, never from the
    // client. A promotion that ends later does not reprice a line already in
    // the basket - which is the behaviour the price snapshot already had.
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
  await cart.populate("items.menuItem");

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

  await cart.populate("items.menuItem");

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
  const { quantity, specialInstructions } = req.body;

  if (quantity == null || quantity < 0) {
    return next(new AppError("Quantity must be 0 or greater", 400));
  }

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

  await cart.populate("items.menuItem");

  res.status(200).json({
    status: "success",
    data: cart,
  });
};
