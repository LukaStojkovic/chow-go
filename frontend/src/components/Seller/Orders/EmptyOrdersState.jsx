import { Package } from "lucide-react";

export function EmptyOrdersState({ statusFilter }) {
  return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No orders found</h3>
      <p className="text-sm text-muted-foreground">
        {statusFilter === "active"
          ? "You don't have any active orders at the moment"
          : `No ${statusFilter} orders found`}
      </p>
    </div>
  );
}
