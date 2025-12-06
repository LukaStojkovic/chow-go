import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CreditCard,
  ChevronRight,
  Bike,
  Home,
  Utensils,
  ShieldCheck,
} from "lucide-react";
import { useDeliveryStore } from "@/store/useDeliveryStore";

const MOCK_CART = {
  restaurant: "Burger King",
  items: [
    {
      id: 1,
      name: "Double Cheeseburger",
      price: 12.5,
      quantity: 1,
      options: "Extra Cheese",
    },
    {
      id: 2,
      name: "Spicy Chicken Wings",
      price: 8.9,
      quantity: 2,
      options: "Ranch Dip",
    },
  ],
  subtotal: 30.3,
  deliveryFee: 2.5,
  serviceFee: 1.5,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { address } = useDeliveryStore();

  const [tipAmount, setTipAmount] = useState(2.0);
  const [deliveryType, setDeliveryType] = useState("priority");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const total =
    MOCK_CART.subtotal +
    MOCK_CART.deliveryFee +
    MOCK_CART.serviceFee +
    tipAmount +
    (deliveryType === "priority" ? 1.99 : 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 sm:py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="container mx-auto flex max-w-5xl items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 sm:h-5 w-4 sm:w-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="container mx-auto grid max-w-5xl gap-4 sm:gap-6 lg:gap-8 px-3 sm:px-4 py-4 sm:py-8 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <section className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold">
                <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 shrink-0" />
                <span>Delivery Address</span>
              </h2>
              <button className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline">
                Edit
              </button>
            </div>

            <div className="mb-4 h-24 sm:h-32 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-zinc-800">
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-xs sm:text-sm font-medium">Map View</span>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                <Home className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base">
                  {address || "123 Main Street, Apt 4B"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  New York, NY 10001
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Note to driver: Gate code is 1234
                </p>
              </div>
            </div>
          </section>

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
                    <p className="text-xs sm:text-sm text-gray-500">
                      25-40 min
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0 text-sm sm:text-base">
                  Free
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-base sm:text-lg font-bold">
              <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 shrink-0" />
              <span>Payment Method</span>
            </h2>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 sm:p-4 gap-3 dark:border-zinc-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-12 sm:w-14 items-center justify-center rounded bg-gray-100 shrink-0 dark:bg-zinc-800">
                  <span className="text-xs font-bold">VISA</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base">
                    Visa ending in 4242
                  </p>
                  <p className="text-xs text-gray-500">Expires 12/28</p>
                </div>
              </div>
              <button className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline shrink-0">
                Change
              </button>
            </div>
          </section>

          <section className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 flex items-center gap-2 text-base sm:text-lg font-bold">
              <Bike className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 shrink-0" />
              <span>Tip your courier</span>
            </h2>
            <p className="mb-4 text-xs sm:text-sm text-gray-500">
              100% of the tip goes to your courier.
            </p>

            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
              {[0, 2, 4, 6].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`min-w-3.5rem sm:min-w-4rem rounded-full border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
                    tipAmount === amount
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  {amount === 0 ? "Not now" : `$${amount}`}
                </button>
              ))}
              <button
                className="min-w-3.5rem sm:min-w-4rem rounded-full border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-gray-50 shrink-0 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => document.getElementById("custom-tip")?.focus()}
              >
                Custom
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 sm:top-24 space-y-4 sm:space-y-6">
            <div className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg sm:text-xl shrink-0">
                  🍔
                </div>
                <h2 className="font-bold text-base sm:text-lg">
                  {MOCK_CART.restaurant}
                </h2>
              </div>

              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 border-b border-gray-100 pb-4 sm:pb-6 dark:border-zinc-800">
                {MOCK_CART.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-2 sm:gap-4"
                  >
                    <div className="flex gap-2 min-w-0">
                      <span className="font-semibold text-blue-600 shrink-0">
                        {item.quantity}x
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">{item.options}</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${MOCK_CART.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span>${MOCK_CART.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Service Fee</span>
                  <span>${MOCK_CART.serviceFee.toFixed(2)}</span>
                </div>
                {deliveryType === "priority" && (
                  <div className="flex justify-between text-blue-600">
                    <span>Priority Delivery</span>
                    <span>$1.99</span>
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
              By placing your order, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
