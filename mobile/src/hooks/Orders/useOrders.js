import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Hermes has no crypto.randomUUID.
import { randomUUID } from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// One key per checkout attempt, held until the order lands, so two taps send the
// same key and the backend returns the first order rather than placing a second.
// Persisted rather than held in a ref: leaving checkout after a request that
// timed out but actually succeeded used to mint a new key and a second order.
const checkoutKeyName = (restaurantId) => `chowgo:checkout-key:${restaurantId}`;

async function checkoutKey(restaurantId) {
  try {
    const existing = await AsyncStorage.getItem(checkoutKeyName(restaurantId));
    if (existing) return existing;
    const created = randomUUID();
    await AsyncStorage.setItem(checkoutKeyName(restaurantId), created);
    return created;
  } catch {
    return randomUUID();
  }
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) =>
      createOrder({ ...payload, idempotencyKey: await checkoutKey(payload.restaurantId) }),
    onSuccess: (_order, payload) => {
      AsyncStorage.removeItem(checkoutKeyName(payload?.restaurantId)).catch(() => {});
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
