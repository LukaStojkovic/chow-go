import { Bike } from "lucide-react";
import React from "react";

export default function TipCourierSectionPicker({
  setCustomTip,
  customTip,
  setTipAmount,
  tipAmount,
}) {
  return (
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
            className={`min-w-20 rounded-full border px-4 py-2 text-sm font-semibold transition-colors shrink-0 ${
              tipAmount === amount
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {amount === 0 ? "Not now" : `$${amount}`}
          </button>
        ))}
        <input
          id="custom-tip"
          type="number"
          placeholder="Custom"
          value={customTip}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            setCustomTip(e.target.value);
            setTipAmount(val);
          }}
          className="min-w-20 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-center dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
    </section>
  );
}
