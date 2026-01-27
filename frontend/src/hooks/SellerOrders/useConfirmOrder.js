import { confirmOrder as confirmOrderApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  const { mutate: confirmOrder, isPending: isConfirming } = useMutation({
    mutationFn: ({ orderId, estimatedPreparationTime }) =>
      confirmOrderApi(orderId, estimatedPreparationTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
      toast.success("Order confirmed successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to confirm order");
    },
  });

  return { confirmOrder, isConfirming };
}
