import { cancelRestaurantOrder as cancelRestaurantOrderApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCancelRestaurantOrder() {
  const queryClient = useQueryClient();

  const { mutate: cancelRestaurantOrder, isPending: isCancelling } =
    useMutation({
      mutationFn: ({ orderId, reason }) =>
        cancelRestaurantOrderApi(orderId, reason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
        toast.success("Order cancelled successfully");
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Failed to cancel order");
      },
    });

  return { cancelRestaurantOrder, isCancelling };
}
