import { createOrder as createOrderApi } from "@/services/apiOrder";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import useCartStore from "@/store/useCartStore";

export function useCreateOrder() {
  const navigate = useNavigate();
  const { clearCart } = useCartStore();

  const { mutate: createOrder, isPending: isCreatingOrder } = useMutation({
    mutationFn: createOrderApi,
    onSuccess: (data) => {
      toast.success("Order placed successfully!");
      clearCart();
      navigate(`/orders/${data.data.order._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to place order");
    },
  });

  return { createOrder, isCreatingOrder };
}
