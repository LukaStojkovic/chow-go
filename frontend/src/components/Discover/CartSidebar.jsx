import React from "react";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const MOCK_CART_ITEMS = [
  {
    id: 1,
    name: "Double Cheeseburger",
    description: "Extra cheese, pickles, special sauce",
    price: 12.5,
    quantity: 1,
    image: "🍔",
  },
  {
    id: 2,
    name: "Spicy Chicken Wings",
    description: "6 pieces with ranch dip",
    price: 8.9,
    quantity: 2,
    image: "🍗",
  },
];

export default function CartSidebar({ isOpen, onClose }) {
  const subtotal = MOCK_CART_ITEMS.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const deliveryFee = 2.5;
  const total = subtotal + deliveryFee;

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
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {MOCK_CART_ITEMS.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                  🍔
                </div>
                <div>
                  <h3 className="font-semibold">Burger King</h3>
                  <p className="text-xs text-blue-600 cursor-pointer hover:underline">
                    View menu
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {MOCK_CART_ITEMS.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-2xl dark:bg-zinc-800">
                      {item.image}
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

                      <div className="mt-2 flex w-fit items-center rounded-full bg-gray-100 p-1 dark:bg-zinc-800">
                        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 dark:bg-zinc-700 dark:hover:bg-zinc-600">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 dark:bg-zinc-700 dark:hover:bg-zinc-600">
                          <Plus className="h-3 w-3" />
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

        {MOCK_CART_ITEMS.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="group flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-4 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <span className="font-bold">Go to checkout</span>
              <span className="flex items-center gap-2 rounded-lg bg-blue-500/30 px-2 py-1 text-sm font-semibold">
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
