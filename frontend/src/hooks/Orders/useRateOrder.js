import { rateOrder as rateOrderApi } from "@/services/apiOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export function useRateOrder(orderId) {
  const queryClient = useQueryClient();

  const { mutate: rateOrder, isPending: isRating } = useMutation({
    mutationFn: (payload) => rateOrderApi(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      toast.success(t("order:rating.submitted"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("order:rating.submitFailedShort"));
    },
  });

  return { rateOrder, isRating };
}
