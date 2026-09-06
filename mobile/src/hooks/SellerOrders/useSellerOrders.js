import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelRestaurantOrder,
  confirmOrder,
  getRestaurantOrders,
  rejectOrder,
  updateOrderStatus,
} from "@/services/apiRestaurantOrder";

const KEY = ["restaurantOrders"];

export function useSellerOrders(params) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => getRestaurantOrders(params),
  });
}

function useInvalidatingMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useConfirmOrder = () =>
  useInvalidatingMutation(({ orderId, estimatedPreparationTime }) =>
    confirmOrder(orderId, estimatedPreparationTime),
  );

export const useRejectOrder = () =>
  useInvalidatingMutation(({ orderId, reason }) => rejectOrder(orderId, reason));

export const useUpdateOrderStatus = () =>
  useInvalidatingMutation(({ orderId, status }) => updateOrderStatus(orderId, status));

export const useCancelRestaurantOrder = () =>
  useInvalidatingMutation(({ orderId, reason }) => cancelRestaurantOrder(orderId, reason));
