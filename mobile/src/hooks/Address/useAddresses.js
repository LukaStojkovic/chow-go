import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDeliveryAddress,
  deleteDeliveryAddress,
  getDeliveryAddresses,
  setDefaultAddress,
  updateDeliveryAddress,
} from "@/services/apiAddress";

const KEY = ["deliveryAddresses"];

export function useAddresses() {
  return useQuery({ queryKey: KEY, queryFn: getDeliveryAddresses });
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
