import { updateOrderStatus as updateOrderStatusApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  const { mutate: updateOrderStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatusApi(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update order");
    },
  });

  return { updateOrderStatus, isUpdating };
}
