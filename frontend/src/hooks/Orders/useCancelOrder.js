import { cancelOrder as cancelOrderApi } from "@/services/apiOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export function useCancelOrder() {
  const queryClient = useQueryClient();

  const { mutate: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: ({ orderId, reason }) => cancelOrderApi(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      toast.success(t("order:detail.cancelledSuccess"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("order:detail.cancelFailedShort"));
    },
  });

  return { cancelOrder, isCancelling };
}
