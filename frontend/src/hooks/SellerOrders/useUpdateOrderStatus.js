import { updateOrderStatus as updateOrderStatusApi } from "@/services/apiRestaurantOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  const { mutate: updateOrderStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatusApi(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
      toast.success(t("seller:orders.statusUpdated"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("seller:orders.statusUpdateFailed"));
    },
  });

  return { updateOrderStatus, isUpdating };
}
