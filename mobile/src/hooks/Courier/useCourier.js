import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptOrder,
  getAvailableOrders,
  getCourierOrderById,
  getCourierOrders,
  getCourierOverview,
  getCourierProfile,
  markDelivered,
  markInTransit,
  markPickedUp,
  releaseOrder,
  setDutyStatus,
  updateCourierProfile,
} from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";

export function useAvailableOrders() {
  return useQuery({ queryKey: ["courierAvailableOrders"], queryFn: () => getAvailableOrders() });
}

export function useCourierOrders(status) {
  return useQuery({
    queryKey: ["courierOrders", status],
    queryFn: () => getCourierOrders({ status }),
  });
}

export function useCourierOrder(orderId) {
  return useQuery({
    queryKey: ["courierOrder", orderId],
    queryFn: () => getCourierOrderById(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCourierOverview() {
  return useQuery({ queryKey: ["courierOverview"], queryFn: getCourierOverview });
}

export function useCourierProfile() {
  return useQuery({ queryKey: ["courierProfile"], queryFn: getCourierProfile });
}

// Every claim and transition moves an order between the pool, the active list
// and history, so they all invalidate the same set.
function useCourierMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of [
        ["courierAvailableOrders"],
        ["courierOrders"],
        ["courierOrder"],
        ["courierOverview"],
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export const useAcceptOrder = () => useCourierMutation((orderId) => acceptOrder(orderId));
export const useReleaseOrder = () =>
  useCourierMutation(({ orderId, reason }) => releaseOrder(orderId, { reason }));
export const useMarkPickedUp = () => useCourierMutation((orderId) => markPickedUp(orderId));
export const useMarkInTransit = () => useCourierMutation((orderId) => markInTransit(orderId));
export const useMarkDelivered = () => useCourierMutation((orderId) => markDelivered(orderId));

export function useDutyStatus() {
  const queryClient = useQueryClient();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return useMutation({
    mutationFn: setDutyStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courierProfile"] });
      // Duty state lives on the courier satellite that protectedRoute hydrates,
      // so the session copy goes stale otherwise.
      checkAuth();
    },
  });
}

export function useUpdateCourierProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCourierProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courierProfile"] });
      queryClient.invalidateQueries({ queryKey: ["courierOverview"] });
    },
  });
}
