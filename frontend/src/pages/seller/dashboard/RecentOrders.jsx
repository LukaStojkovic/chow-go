import { Package } from "lucide-react";

const getStatusColor = (status) => {
  const colors = {
    pending:
      "bg-warning-subtle text-warning ",
    confirmed:
      "bg-primary-subtle text-primary ",
    preparing:
      "bg-warning-subtle text-warning ",
    ready:
      "bg-primary-subtle text-primary ",
  };
  return (
    colors[status] ||
    "bg-muted text-muted-foreground "
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
    <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground ">
          Recent Orders
        </h3>
        <Package className="w-5 h-5 text-muted-foreground" />
      </div>

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border ">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground ">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground ">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground ">
                  Items
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground ">
                  Total
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground ">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground ">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="py-4 px-4 text-sm font-medium text-foreground ">
                    {order.orderNumber}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground ">
                    {order.customer?.name || "Guest"}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground ">
                    {order.items?.reduce(
                      (sum, item) => sum + (item.quantity || 0),
                      0,
                    ) || 0}{" "}
                    items
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-foreground ">
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
                  <td className="py-4 px-4 text-sm text-muted-foreground ">
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
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            No recent orders
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Active orders will appear here
          </p>
        </div>
      )}
    </div>
  );
};
