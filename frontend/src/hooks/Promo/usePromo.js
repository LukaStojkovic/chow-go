import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";
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
    placeholderData: keepPreviousData,
  });
}

export function useSellerPromoStats(id) {
  return useQuery({
    queryKey: ["sellerPromoStats", id],
    queryFn: () => getSellerPromoStats(id),
    enabled: Boolean(id),
  });
}

function useSellerPromoMutation(mutationFn, successKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey));
      queryClient.invalidateQueries({ queryKey: ["sellerPromoCodes"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t("errors:request.generic"));
    },
  });
}

export const useCreateSellerPromo = () => useSellerPromoMutation(createSellerPromoCode, "promo:manage.saved");
export const useUpdateSellerPromo = () => useSellerPromoMutation(updateSellerPromoCode, "promo:manage.saved");
export const useSellerPromoStatus = () => useSellerPromoMutation(setSellerPromoStatus, "promo:manage.updated");
