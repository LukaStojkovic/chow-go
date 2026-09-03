export default function CourierOrderHistoryCard({ order }) {
  return (
    <div
      key={order._id}
      className="flex items-center justify-between rounded-xl border border-border bg-card p-4 "
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground ">
            {order.restaurant?.name}
          </p>
          {order.status === "delivered" ? (
            <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-semibold text-primary ">
              Delivered
            </span>
          ) : (
            <span className="rounded-full bg-destructive-subtle px-2 py-0.5 text-xs font-semibold text-destructive ">
              Cancelled
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground ">
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
            ? "text-primary "
            : "text-muted-foreground line-through"
        }`}
      >
        ${order.total?.toFixed(2) ?? "0.00"}{" "}
      </span>
    </div>
  );
}
