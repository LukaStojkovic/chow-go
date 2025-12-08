import React from "react";
import { RefreshCw } from "lucide-react";

export default function RecentOrders({ orders, onViewAll, onReorder }) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
          Recent Orders
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
          >
            <div className="flex items-start gap-4 mb-3 sm:mb-0 overflow-hidden">
              <div className="w-10 h-10 shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-lg">
                🍔
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                    {order.restaurant}
                  </h4>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      order.status === "Delivered"
                        ? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {order.items}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {order.date} • {order.total}
                </p>
              </div>
            </div>

            <button
              onClick={() => onReorder(order.id)}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition w-full sm:w-auto shrink-0"
            >
              <RefreshCw size={12} /> Re-order
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
