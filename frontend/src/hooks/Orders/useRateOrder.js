import { rateOrder as rateOrderApi } from "@/services/apiOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useRateOrder(orderId) {
  const queryClient = useQueryClient();

  const { mutate: rateOrder, isPending: isRating } = useMutation({
    mutationFn: (payload) => rateOrderApi(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      toast.success("Thank you for your review!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to submit review");
    },
  });

  return { rateOrder, isRating };
}
