import { cancelRestaurantOrder as cancelRestaurantOrderApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export function useCancelRestaurantOrder() {
  const queryClient = useQueryClient();

  const { mutate: cancelRestaurantOrder, isPending: isCancelling } =
    useMutation({
      mutationFn: ({ orderId, reason }) =>
        cancelRestaurantOrderApi(orderId, reason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
        toast.success(t("seller:orders.cancelled"));
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || t("seller:orders.cancelFailed"));
      },
    });

  return { cancelRestaurantOrder, isCancelling };
}
