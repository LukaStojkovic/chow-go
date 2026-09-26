import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { createOrder as createOrderApi } from "@/services/apiOrder";
import useCartStore from "@/store/useCartStore";
import { askForNotifications } from "@/hooks/Sockets/useGlobalSocketEvents";

// One key per checkout attempt, held until the order lands, so two taps send the
// same key and the backend hands the second the first one's order. It lives in
// sessionStorage rather than a ref: a reload after a request that timed out but
// actually succeeded used to mint a new key and place a second order.
const checkoutKeyName = (restaurantId) => `chowgo:checkout-key:${restaurantId}`;

function checkoutKey(restaurantId) {
  try {
    const existing = sessionStorage.getItem(checkoutKeyName(restaurantId));
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(checkoutKeyName(restaurantId), created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function clearCheckoutKey(restaurantId) {
  try {
    sessionStorage.removeItem(checkoutKeyName(restaurantId));
  } catch {
    // Storage unavailable: the key was never persisted.
  }
}

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

  const { mutate, isPending: isCreatingOrder } = useMutation({
    mutationFn: (orderData) =>
      createOrderApi({ ...orderData, idempotencyKey: checkoutKey(orderData.restaurantId) }),

    onSuccess: (data, orderData) => {
      clearCheckoutKey(orderData?.restaurantId);
      const orderId = data?.data?.order?._id;

      useCartStore.setState({ items: [], totalPrice: 0, restaurant: null });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      askForNotifications();

      if (orderId) {
        navigate(`/orders/${orderId}/confirmed`, { replace: true });
      } else {
        // The order was created but the response was not the shape we expect;
        // order history is the safe landing place.
        toast.success(t("order:detail.placed"));
        navigate("/orders", { replace: true });
      }
    },

    onError: (error) => {
      // Nothing was placed: the server repriced the basket, so show the new
      // total before the customer confirms again.
      const code = error?.response?.data?.code;
      if (code === "PRICE_CHANGED" || code === "ITEM_UNAVAILABLE") {
        useCartStore.getState().fetchCart();
      }
      toast.error(
        error?.response?.data?.message ||
          t("order:detail.placeFailedLong"),
      );
    },
  });

  const createOrder = useCallback((orderData) => mutate(orderData), [mutate]);

  return { createOrder, isCreatingOrder };
}
