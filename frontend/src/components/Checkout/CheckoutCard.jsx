import { ShieldCheck } from "lucide-react";
import React from "react";

export default function CheckoutCard({
  items,
  restaurant,
  subtotal,
  baseDeliveryFee,
  serviceFee,
  priorityFee,
  tipAmount,
  total,
}) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-20 sm:top-24 space-y-4 sm:space-y-6">
        <div className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2 sm:gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white dark:ring-zinc-800">
              {restaurant?.profilePicture ? (
                <img
                  src={restaurant.profilePicture}
                  alt={restaurant.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-300 dark:bg-zinc-700">
                  <span className="text-2xl">🍔</span>
                </div>
              )}
            </div>
            <h2 className="font-bold text-base sm:text-lg">
              {restaurant?.name || "Restaurant"}
            </h2>
          </div>

          <div className="mb-4 sm:mb-6 space-y-4 border-b border-gray-100 pb-5 dark:border-zinc-800">
            {items.map((item) => {
              const menuItem = item.menuItem;
              const imageUrl = menuItem?.imageUrls?.[0];
              const itemName = item.name || menuItem?.name || "Item";

              return (
                <div
                  key={menuItem?._id || menuItem?.id}
                  className="flex items-center gap-3"
                >
                  <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={itemName}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">
                        🍕
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-2">
                          {itemName}
                        </p>
                        {item.options && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {item.options}
                          </p>
                        )}
                      </div>

                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">
                        {item.quantity}x
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span>${baseDeliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Service Fee</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            {priorityFee > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Priority Delivery</span>
                <span>${priorityFee.toFixed(2)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Courier Tip</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-zinc-800">
            <span className="font-bold text-base sm:text-lg">Total</span>
            <span className="text-lg sm:text-xl font-bold">
              ${total.toFixed(2)}
            </span>
          </div>

          <button className="mt-4 sm:mt-6 w-full rounded-lg sm:rounded-xl bg-blue-600 py-3 sm:py-4 font-bold text-white text-sm sm:text-base shadow-lg shadow-blue-600/20 transition-transform active:scale-[0.98] hover:bg-blue-700">
            Place order
          </button>

          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span>Secure SSL Encryption</span>
          </div>
        </div>

        <p className="px-2 text-center text-xs text-gray-400">
          By placing your order, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}
