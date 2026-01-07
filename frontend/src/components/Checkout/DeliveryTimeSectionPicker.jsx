import { Clock } from "lucide-react";
import React from "react";

export default function DeliveryTimeSectionPicker({
  deliveryType,
  setDeliveryType,
}) {
  return (
    <section className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 flex items-center gap-2 text-base sm:text-lg font-bold">
        <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 shrink-0" />
        <span>Delivery Time</span>
      </h2>

      <div className="space-y-3">
        <label
          className={`flex cursor-pointer items-center justify-between rounded-lg sm:rounded-xl border p-3 sm:p-4 transition-all gap-3 ${
            deliveryType === "priority"
              ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
              : "border-gray-200 hover:border-gray-300 dark:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <input
              type="radio"
              name="delivery"
              className="h-5 w-5 text-blue-600 shrink-0"
              checked={deliveryType === "priority"}
              onChange={() => setDeliveryType("priority")}
            />
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base">
                Priority Delivery
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                15-20 min • Direct to you
              </p>
            </div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0 text-sm sm:text-base">
            +$1.99
          </span>
        </label>

        <label
          className={`flex cursor-pointer items-center justify-between rounded-lg sm:rounded-xl border p-3 sm:p-4 transition-all gap-3 ${
            deliveryType === "standard"
              ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
              : "border-gray-200 hover:border-gray-300 dark:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <input
              type="radio"
              name="delivery"
              className="h-5 w-5 text-blue-600 shrink-0"
              checked={deliveryType === "standard"}
              onChange={() => setDeliveryType("standard")}
            />
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base">Standard</p>
              <p className="text-xs sm:text-sm text-gray-500">25-40 min</p>
            </div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0 text-sm sm:text-base">
            Free
          </span>
        </label>
      </div>
    </section>
  );
}
