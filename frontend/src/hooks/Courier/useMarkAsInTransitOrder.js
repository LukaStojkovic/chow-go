import { markInTransit } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useMarkAsInTransitOrder() {
  const queryClient = useQueryClient();

  const { mutate: markInTransitOrder, isPending: isMarkingInTransit } =
    useMutation({
      mutationFn: markInTransit,
      onSuccess: (_, orderId) => {
        toast.success("Order marked as in transit!");
        queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
        queryClient.invalidateQueries({
          queryKey: ["courierOrders", "active"],
        });
        queryClient.invalidateQueries({
          queryKey: ["courierOrders", "history"],
        });
        queryClient.invalidateQueries({ queryKey: ["courierOrder", orderId] });
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ?? "Failed to mark order as in transit",
        );
      },
    });

  return { markInTransitOrder, isMarkingInTransit };
}
