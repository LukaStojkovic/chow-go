import { CreditCard, DollarSign } from "lucide-react";
import React from "react";

export default function PaymentMethodSectionPicker({
  setPaymentMethod,
  paymentMethod,
}) {
  return (
    <section className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 flex items-center gap-2 text-base sm:text-lg font-bold">
        <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 shrink-0" />
        <span>Payment Method</span>
      </h2>

      <div className="space-y-3">
        <label
          className={`flex cursor-pointer items-center justify-between rounded-lg sm:rounded-xl border p-4 transition-all ${
            paymentMethod === "card"
              ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
              : "border-gray-200 hover:border-gray-300 dark:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-4">
            <input
              type="radio"
              name="payment"
              className="h-5 w-5 text-blue-600"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100 dark:bg-zinc-800">
                <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Credit or Debit Card
                </p>
                <p className="text-xs text-gray-500">
                  Visa ending in 4242 • Expires 12/28
                </p>
              </div>
            </div>
          </div>
          <button className="text-xs font-medium text-blue-600 hover:underline">
            Change
          </button>
        </label>

        <label
          className={`flex cursor-pointer items-center justify-between rounded-lg sm:rounded-xl border p-4 transition-all ${
            paymentMethod === "cash"
              ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
              : "border-gray-200 hover:border-gray-300 dark:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-4">
            <input
              type="radio"
              name="payment"
              className="h-5 w-5 text-blue-600"
              checked={paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")}
            />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100 dark:bg-zinc-800">
                <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Cash on Delivery
                </p>
                <p className="text-xs text-gray-500">
                  Pay with cash when your order arrives
                </p>
              </div>
            </div>
          </div>
        </label>
      </div>
    </section>
  );
}
