import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSellerPromoCode,
  getMyVouchers,
  getSellerPromoCodes,
  getSellerPromoStats,
  setSellerPromoStatus,
  updateSellerPromoCode,
  validatePromoCode,
} from "@/services/apiPromo";

export function useMyVouchers({ enabled = true } = {}) {
  return useQuery({ queryKey: ["myVouchers"], queryFn: getMyVouchers, enabled });
}

export function useValidatePromo() {
  return useMutation({ mutationFn: validatePromoCode });
}

export function useSellerPromoCodes(params) {
  return useQuery({
    queryKey: ["sellerPromoCodes", params],
    queryFn: () => getSellerPromoCodes(params),
  });
}

export function useSellerPromoStats(id) {
  return useQuery({
    queryKey: ["sellerPromoStats", id],
    queryFn: () => getSellerPromoStats(id),
    enabled: Boolean(id),
  });
}

function useSellerPromoMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerPromoCodes"] });
      queryClient.invalidateQueries({ queryKey: ["sellerPromoStats"] });
    },
  });
}

export const useCreateSellerPromo = () => useSellerPromoMutation(createSellerPromoCode);
export const useUpdateSellerPromo = () => useSellerPromoMutation(updateSellerPromoCode);
export const useSellerPromoStatus = () => useSellerPromoMutation(setSellerPromoStatus);
