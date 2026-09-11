import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDeliveryAddress,
  deleteDeliveryAddress,
  getDeliveryAddresses,
  setDefaultAddress,
  updateDeliveryAddress,
} from "@/services/apiAddress";
import { useAuthStore } from "@/store/useAuthStore";

const KEY = ["deliveryAddresses"];

// Guarded on the session the way useFavourites is: the profile tab renders for
// guests too, and an unguarded query fires a 401 the moment they open it.
export function useAddresses() {
  const authUser = useAuthStore((state) => state.authUser);
  return useQuery({ queryKey: KEY, queryFn: getDeliveryAddresses, enabled: Boolean(authUser) });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDeliveryAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, ...payload }) => updateDeliveryAddress(addressId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
