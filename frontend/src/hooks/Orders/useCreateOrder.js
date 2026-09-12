import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { createOrder as createOrderApi } from "@/services/apiOrder";
import useCartStore from "@/store/useCartStore";

/**
 * Place an order.
 *
 * Lands on the confirmation screen rather than straight into live tracking:
 * the customer needs a beat to see the order number, the total and what
 * happens next before being handed a status timeline. Tracking is one tap
 * away from there.
 *
 * The backend deletes the cart as part of creating the order, so the local
 * mirror is cleared too - otherwise the basket badge keeps its old count until
 * the next fetch.
 */
export function useCreateOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // One key per checkout attempt, held until the order lands. Two taps send
  // the same key, so the backend hands the second one the first one's order
  // instead of creating a duplicate.
  const keyRef = useRef(null);

  const { mutate, isPending: isCreatingOrder } = useMutation({
    mutationFn: (orderData) => {
      if (!keyRef.current) keyRef.current = crypto.randomUUID();
      return createOrderApi({ ...orderData, idempotencyKey: keyRef.current });
    },

    onSuccess: (data) => {
      keyRef.current = null;
      const orderId = data?.data?.order?._id;

      useCartStore.setState({ items: [], totalPrice: 0, restaurant: null });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });

      if (orderId) {
        navigate(`/orders/${orderId}/confirmed`, { replace: true });
      } else {
        // The order was created but the response was not the shape we expect;
        // order history is the safe landing place.
        toast.success("Your order was placed.");
        navigate("/orders", { replace: true });
      }
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "We could not place your order. Nothing has been charged - please try again.",
      );
    },
  });

  const createOrder = useCallback((orderData) => mutate(orderData), [mutate]);

  return { createOrder, isCreatingOrder };
}
