import React from "react";
import { RefreshCw, Package } from "lucide-react";

function formatOrderDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago, ${timeStr}`;
  return date.toLocaleDateString();
}

function formatStatus(status) {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecentOrders({
  orders,
  onViewAll,
  onReorder,
  isLoading,
}) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
          Recent Orders
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Package size={32} className="mb-2" />
          <p className="text-sm">No recent orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
            >
              <div className="flex items-start gap-4 mb-3 sm:mb-0 overflow-hidden">
                <div className="w-10 h-10 shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {order.restaurant?.profilePicture ? (
                    <img
                      src={order.restaurant.profilePicture}
                      alt={order.restaurant?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🍔</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                      {order.restaurant?.name || "Restaurant"}
                    </h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        order.status === "delivered"
                          ? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                          : order.status === "cancelled" ||
                              order.status === "rejected"
                            ? "bg-red-50 text-red-500"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {order.items
                      ?.map((item) => `${item.quantity}x ${item.name}`)
                      .join(", ") || "No items"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatOrderDate(order.createdAt)} •{" "}
                    ${(order.total ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {order.status === "delivered" && (
                <button
                  onClick={() => onReorder(order._id)}
                  className="flex cursor-pointer items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition w-full sm:w-auto shrink-0"
                >
                  <RefreshCw size={12} /> Re-order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
