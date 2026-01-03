import React, { useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import useCartStore from "@/store/useCartStore";
import { useDebouncedCallback } from "use-debounce";
import { useAuthStore } from "@/store/useAuthStore";

export default function CartSidebar({ isOpen, onClose }) {
  const { authUser } = useAuthStore();
  const {
    items,
    totalPrice,
    restaurant,
    updateItemQuantity,
    removeItem,
    clearCart,
    fetchCart,
  } = useCartStore();

  const deliveryFee = 2.5;
  const total = totalPrice + deliveryFee;

  useEffect(() => {
    if (isOpen && authUser) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  const handleQuantityChange = (menuItemId, newQuantity) => {
    useCartStore.setState((state) => {
      let newItems;
      if (newQuantity <= 0) {
        newItems = state.items.filter(
          (item) => (item.menuItem._id || item.menuItem.id) !== menuItemId
        );
      } else {
        newItems = state.items.map((item) =>
          (item.menuItem._id || item.menuItem.id) === menuItemId
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      const newTotal = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return { items: newItems, totalPrice: newTotal };
    });
  };

  const syncQuantityToServer = useDebouncedCallback((menuItemId, quantity) => {
    if (quantity > 0) {
      updateItemQuantity(menuItemId, quantity).catch(() => fetchCart());
    } else {
      removeItem(menuItemId).catch(() => fetchCart());
    }
  }, 300);

  const onIncrease = (menuItemId, currentQuantity) => {
    const newQty = currentQuantity + 1;
    handleQuantityChange(menuItemId, newQty);
    syncQuantityToServer(menuItemId, newQty);
  };

  const onDecrease = (menuItemId, currentQuantity) => {
    const newQty = currentQuantity - 1;
    handleQuantityChange(menuItemId, newQty);
    syncQuantityToServer(menuItemId, newQty);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-bold">Your Order</h2>
          <button
            onClick={onClose}
            className="rounded-full cursor-pointer p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white dark:ring-zinc-800">
                  {restaurant?.profilePicture ? (
                    <img
                      src={restaurant.profilePicture}
                      alt={restaurant.name || "Restaurant"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-300 dark:bg-zinc-700">
                      <span className="text-2xl">🍔</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">
                    {restaurant?.name || "Unknown Restaurant"}
                  </h3>
                  <Link to={`/restaurant/${restaurant._id}`}>
                    <span className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                      View menu
                    </span>
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
                      {item.menuItem.imageUrls?.[0] ? (
                        <img
                          src={item.menuItem.imageUrls[0]}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl opacity-20">
                          🍕
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <span className="font-medium line-clamp-1">
                          {item.name}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {item.description}
                      </p>

                      <div className="mt-2 flex items-end justify-between w-full">
                        <div className="flex items-center rounded-full bg-gray-100 p-1 dark:bg-zinc-800">
                          <button
                            onClick={() =>
                              onDecrease(
                                item.menuItem._id || item.menuItem.id,
                                item.quantity
                              )
                            }
                            className="h-8 w-8 flex items-center justify-center cursor-pointer rounded-full bg-white shadow-sm hover:bg-gray-50 dark:bg-zinc-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onIncrease(
                                item.menuItem._id || item.menuItem.id,
                                item.quantity
                              )
                            }
                            className="h-8 w-8 flex items-center cursor-pointer justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 dark:bg-zinc-700"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            removeItem(item.menuItem._id || item.menuItem.id)
                          }
                          className="text-red-500 hover:text-red-600 mb-1 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Go ahead and explore some delicious food!
              </p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 text-base font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => clearCart()}
              className="w-full mb-3 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-98 transition dark:border-red-900/30 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-zinc-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>

            <Link
              to="/checkout"
              onClick={onClose}
              className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-5 py-4 text-white font-bold shadow-lg hover:bg-blue-700 active:scale-98 transition"
            >
              <span>Go to checkout</span>
              <span className="flex items-center gap-2 rounded-lg bg-blue-500/30 px-3 py-1.5 text-sm">
                ${total.toFixed(2)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
