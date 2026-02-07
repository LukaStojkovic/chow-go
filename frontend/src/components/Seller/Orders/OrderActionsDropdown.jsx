import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  Clock,
  MoreVertical,
  Package,
  XCircle,
  Ban,
} from "lucide-react";

export function OrderActionsDropdown({
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
  const getMenuItems = () => {
    switch (order.status) {
      case "pending":
        return (
          <>
            <DropdownMenuItem
              onClick={() => onConfirm(order._id)}
              disabled={isConfirming}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Order
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onReject(order._id)}
              disabled={isRejecting}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Order
            </DropdownMenuItem>
          </>
        );
      case "confirmed":
        return (
          <>
            <DropdownMenuItem
              onClick={() => onMarkPreparing(order._id)}
              disabled={isUpdating}
            >
              <Clock className="w-4 h-4 mr-2" />
              Start Preparing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCancel(order._id)}
              disabled={isCancelling}
              className="text-red-600 focus:text-red-600"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Order
            </DropdownMenuItem>
          </>
        );
      case "preparing":
        return (
          <>
            <DropdownMenuItem
              onClick={() => onMarkReady(order._id)}
              disabled={isUpdating}
            >
              <Package className="w-4 h-4 mr-2" />
              Mark as Ready
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCancel(order._id)}
              disabled={isCancelling}
              className="text-red-600 focus:text-red-600"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Order
            </DropdownMenuItem>
          </>
        );
      case "ready":
        return (
          <DropdownMenuItem
            onClick={() => onCancel(order._id)}
            disabled={isCancelling}
            className="text-red-600 focus:text-red-600"
          >
            <Ban className="w-4 h-4 mr-2" />
            Cancel Order
          </DropdownMenuItem>
        );
      default:
        return null;
    }
  };

  const menuItems = getMenuItems();

  if (!menuItems) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <MoreVertical className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{menuItems}</DropdownMenuContent>
    </DropdownMenu>
  );
}
