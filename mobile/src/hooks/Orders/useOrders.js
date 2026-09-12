import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Hermes has no crypto.randomUUID.
import { randomUUID } from "expo-crypto";
import { cancelOrder, createOrder, getCustomerOrders, getOrderById } from "@/services/apiOrder";

export function useCustomerOrders(params) {
  return useQuery({
    queryKey: ["customerOrders", params],
    queryFn: () => getCustomerOrders(params),
  });
}

export function useOrder(orderId) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  // One key per checkout attempt, held until the order lands, so two taps send
  // the same key and the backend returns the first order rather than placing a
  // second one.
  const keyRef = useRef(null);

  return useMutation({
    mutationFn: (payload) => {
      if (!keyRef.current) keyRef.current = randomUUID();
      return createOrder({ ...payload, idempotencyKey: keyRef.current });
    },
    onSuccess: () => {
      keyRef.current = null;
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}

export function useCancelOrder(orderId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason) => cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}
