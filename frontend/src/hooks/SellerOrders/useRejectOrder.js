import { rejectOrder as rejectOrderApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useRejectOrder() {
  const queryClient = useQueryClient();

  const { mutate: rejectOrder, isPending: isRejecting } = useMutation({
    mutationFn: ({ orderId, reason }) => rejectOrderApi(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
      toast.success("Order rejected");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to reject order");
    },
  });

  return { rejectOrder, isRejecting };
}
