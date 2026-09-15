import { confirmOrder as confirmOrderApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  const { mutate: confirmOrder, isPending: isConfirming } = useMutation({
    mutationFn: ({ orderId, estimatedPreparationTime }) =>
      confirmOrderApi(orderId, estimatedPreparationTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
      toast.success(t("seller:orders.confirmed"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("seller:orders.confirmFailed"));
    },
  });

  return { confirmOrder, isConfirming };
}
