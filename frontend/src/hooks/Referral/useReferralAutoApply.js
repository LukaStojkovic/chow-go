import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";
import { referralRewardsFor } from "@chowgo/shared/referral";

import { apiErrorMessage } from "@/lib/apiError";
import {
  clearStoredReferralCode,
  readStoredReferralCode,
  REFERRAL_STORED_EVENT,
} from "@/lib/referralStorage";
import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";
import { MY_REFERRAL_KEY } from "./useReferral";

export function useReferralAutoApply() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.authUser?._id);
  const isCustomer = useAuthStore((state) => state.authUser?.role === "customer");
  const [storedTick, setStoredTick] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const onStored = () => setStoredTick((tick) => tick + 1);
    window.addEventListener(REFERRAL_STORED_EVENT, onStored);
    return () => window.removeEventListener(REFERRAL_STORED_EVENT, onStored);
  }, []);

  useEffect(() => {
    if (!userId || !isCustomer || inFlight.current) return;
    const code = readStoredReferralCode();
    if (!code) return;

    inFlight.current = true;
    (async () => {
      // Kept for the next visit when the server never answered (offline, 5xx);
      // a friend should not lose their discount to a dropped connection.
      let settled = true;
      try {
        const referral = await queryClient.fetchQuery({ queryKey: MY_REFERRAL_KEY, queryFn: getMyReferral });
        if (!referral?.canApplyCode) return;
        const result = await applyReferralCode(code);
        const rewards = result?.rewards ?? referralRewardsFor();
        const amount = formatPrice(rewards.friend, { currency: rewards.currency });
        toast.success(t("profile:referral.applied", { amount }));
        queryClient.invalidateQueries({ queryKey: ["myVouchers"] });
        queryClient.invalidateQueries({ queryKey: MY_REFERRAL_KEY });
      } catch (error) {
        const status = error?.response?.status ?? error?.status;
        settled = Number.isInteger(status) && status >= 400 && status < 500;
        if (settled) {
          const message = apiErrorMessage(error);
          if (message) toast.error(message);
        }
      } finally {
        if (settled) clearStoredReferralCode();
        inFlight.current = false;
      }
    })();
  }, [userId, isCustomer, storedTick, queryClient]);
}
