import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";

export const MY_REFERRAL_KEY = ["myReferral"];

export function useMyReferral() {
  const authUser = useAuthStore((state) => state.authUser);
  return useQuery({
    queryKey: [...MY_REFERRAL_KEY, authUser?._id],
    queryFn: getMyReferral,
    enabled: authUser?.role === "customer",
  });
}

export function useApplyReferralCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code) => applyReferralCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVouchers"] });
      queryClient.invalidateQueries({ queryKey: MY_REFERRAL_KEY });
    },
  });
}
