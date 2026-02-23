import { Package } from "lucide-react";

const getStatusColor = (status) => {
  const colors = {
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    preparing:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    ready:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  return (
    colors[status] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  );
};

const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    assigned: "Assigned",
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

export const RecentOrders = ({ orders }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Orders
        </h3>
        <Package className="w-5 h-5 text-gray-400" />
      </div>

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Items
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Total
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {order.customer?.name || "Guest"}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {order.items?.reduce(
                      (sum, item) => sum + (item.quantity || 0),
                      0,
                    ) || 0}{" "}
                    items
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    ${order.total?.toFixed(2) || "0.00"}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No recent orders
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Active orders will appear here
          </p>
        </div>
      )}
    </div>
  );
};
