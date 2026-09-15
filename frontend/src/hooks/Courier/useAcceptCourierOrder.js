import { acceptOrder } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useAcceptCourierOrder() {
  const queryClient = useQueryClient();

  const { mutate: acceptCourierOrder, isPending: isAccepting } = useMutation({
    mutationFn: acceptOrder,
    onSuccess: (_, orderId) => {
      toast.success(t("courier:orders.headToRestaurant"));
      queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrders", "active"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrders", "history"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrder", orderId] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t("courier:orders.acceptFailed"));
    },
  });

  return { acceptCourierOrder, isAccepting };
}
