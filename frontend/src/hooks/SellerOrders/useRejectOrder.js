import { rejectOrder as rejectOrderApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export function useRejectOrder() {
  const queryClient = useQueryClient();

  const { mutate: rejectOrder, isPending: isRejecting } = useMutation({
    mutationFn: ({ orderId, reason }) => rejectOrderApi(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
      toast.success(t("seller:orders.rejected"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("seller:orders.rejectFailed"));
    },
  });

  return { rejectOrder, isRejecting };
}
