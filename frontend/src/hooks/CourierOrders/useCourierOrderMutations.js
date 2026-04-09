import {
  acceptCourierOrder,
  cancelCourierAssignedOrder,
  markCourierDelivered,
  markCourierInTransit,
  markCourierPickedUp,
} from "@/services/apiCourierOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCourierOrderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
    queryClient.invalidateQueries({ queryKey: ["courierOrders"] });
  };

  const accept = useMutation({
    mutationFn: (orderId) => acceptCourierOrder(orderId),
    onSuccess: () => {
      toast.success("Order accepted");
      invalidate();
    },
    onError: (err) => {
      toast.error("Failed to accept order", {
        description: err?.response?.data?.message || err?.message,
      });
    },
  });

  const cancel = useMutation({
    mutationFn: ({ orderId, reason }) => cancelCourierAssignedOrder(orderId, reason),
    onSuccess: () => {
      toast.success("Assignment cancelled");
      invalidate();
    },
    onError: (err) => {
      toast.error("Failed to cancel assignment", {
        description: err?.response?.data?.message || err?.message,
      });
    },
  });

  const pickedUp = useMutation({
    mutationFn: (orderId) => markCourierPickedUp(orderId),
    onSuccess: () => {
      toast.success("Marked as picked up");
      invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update order", {
        description: err?.response?.data?.message || err?.message,
      });
    },
  });

  const inTransit = useMutation({
    mutationFn: (orderId) => markCourierInTransit(orderId),
    onSuccess: () => {
      toast.success("Marked as in transit");
      invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update order", {
        description: err?.response?.data?.message || err?.message,
      });
    },
  });

  const delivered = useMutation({
    mutationFn: (orderId) => markCourierDelivered(orderId),
    onSuccess: () => {
      toast.success("Marked as delivered");
      invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update order", {
        description: err?.response?.data?.message || err?.message,
      });
    },
  });

  return {
    accept,
    cancel,
    pickedUp,
    inTransit,
    delivered,
  };
}

