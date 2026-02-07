import { createOrder as createOrderApi } from "@/services/apiOrder";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useCreateOrder() {
  const navigate = useNavigate();

  const { mutate: createOrder, isPending: isCreatingOrder } = useMutation({
    mutationFn: createOrderApi,
    onSuccess: (data) => {
      toast.success("Order placed successfully!");

      navigate(`/orders/${data.data.order._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to place order");
    },
  });

  return { createOrder, isCreatingOrder };
}
