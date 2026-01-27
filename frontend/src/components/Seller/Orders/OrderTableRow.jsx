import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, Package, XCircle } from "lucide-react";
import { OrderActionsDropdown } from "./OrderActionsDropdown";

export function OrderTableRow({
  order,
  onConfirm,
  onReject,
  onCancel,
  onMarkPreparing,
  onMarkReady,
  isConfirming,
  isRejecting,
  isCancelling,
  isUpdating,
}) {
  const getStatusVariant = (status) => {
    switch (status) {
      case "pending":
        return "default";
      case "confirmed":
      case "preparing":
        return "secondary";
      case "ready":
        return "outline";
      case "delivered":
        return "success";
      case "cancelled":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "confirmed":
      case "preparing":
        return <Package className="w-3 h-3" />;
      case "ready":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-emerald-600">
        {order.orderNumber}
      </TableCell>
      <TableCell>
        <div className="font-medium">{order.customer?.name || "Unknown"}</div>
        <div className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <div className="flex flex-col">
          <span>{order.items.length}x items</span>
          {order.items.length > 0 && (
            <span className="text-xs text-muted-foreground/70">
              {order.items[0].name}
              {order.items.length > 1 && ` +${order.items.length - 1} more`}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(order.status)}>
          <span className="flex items-center gap-1">
            {getStatusIcon(order.status)}
            {order.status.replace("_", " ").toUpperCase()}
          </span>
        </Badge>
      </TableCell>
      <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
      <TableCell className="text-right">
        <OrderActionsDropdown
          order={order}
          onConfirm={onConfirm}
          onReject={onReject}
          onCancel={onCancel}
          onMarkPreparing={onMarkPreparing}
          onMarkReady={onMarkReady}
          isConfirming={isConfirming}
          isRejecting={isRejecting}
          isCancelling={isCancelling}
          isUpdating={isUpdating}
        />
      </TableCell>
    </TableRow>
  );
}
