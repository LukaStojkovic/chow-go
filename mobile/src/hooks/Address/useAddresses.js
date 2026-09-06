import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDeliveryAddress,
  deleteDeliveryAddress,
  getDeliveryAddresses,
  setDefaultAddress,
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
