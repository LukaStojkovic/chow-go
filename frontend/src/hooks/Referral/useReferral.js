import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";

export const MY_REFERRAL_KEY = ["myReferral"];

export function useMyReferral({ enabled = true } = {}) {
  const isCustomer = useAuthStore((state) => state.authUser?.role === "customer");
  return useQuery({
    queryKey: MY_REFERRAL_KEY,
    queryFn: getMyReferral,
    enabled: enabled && isCustomer,
  });
}

export function useApplyReferralCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyReferralCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVouchers"] });
      queryClient.invalidateQueries({ queryKey: MY_REFERRAL_KEY });
    },
  });
}
