import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customerOrders"] }),
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
