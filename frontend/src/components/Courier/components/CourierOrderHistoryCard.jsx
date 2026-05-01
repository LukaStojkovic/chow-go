export default function CourierOrderHistoryCard({ order }) {
  return (
    <div
      key={order._id}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white">
            {order.restaurant?.name}
          </p>
          {order.status === "delivered" ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Delivered
            </span>
          ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Cancelled
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          #{order.orderNumber?.split("-")[2] ?? order.orderNumber ?? "N/A"} •{" "}
          {order.deliveredAt || order.cancelledAt
            ? new Date(
                order.deliveredAt ?? order.cancelledAt,
              ).toLocaleDateString()
            : "N/A"}
        </p>{" "}
      </div>
      <span
        className={`font-bold ${
          order.status === "delivered"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400 dark:text-gray-500 line-through"
        }`}
      >
        ${order.total?.toFixed(2) ?? "0.00"}{" "}
      </span>
    </div>
  );
}
