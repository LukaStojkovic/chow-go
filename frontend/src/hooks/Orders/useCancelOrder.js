import { cancelOrder as cancelOrderApi } from "@/services/apiOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCancelOrder() {
  const queryClient = useQueryClient();

  const { mutate: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: ({ orderId, reason }) => cancelOrderApi(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      toast.success("Order cancelled successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to cancel order");
    },
  });

  return { cancelOrder, isCancelling };
}
