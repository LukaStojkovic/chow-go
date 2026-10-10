import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@chowgo/shared/format";
import { isValidReferralCode, normalizeReferralCode } from "@chowgo/shared/referral";
import { errorMessage } from "@/api/client";
import { MY_REFERRAL_KEY } from "@/hooks/Referral/useReferral";
import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

const KEY = "chowgo:pending-referral";
const listeners = new Set();

export async function savePendingReferral(code) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return null;
  await AsyncStorage.setItem(KEY, normalized).catch(() => {});
  listeners.forEach((listener) => listener());
  return normalized;
}

export async function readPendingReferral() {
  try {
    return (await AsyncStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function clearPendingReferral() {
  return AsyncStorage.removeItem(KEY).catch(() => {});
}

export function useReferralApplyToast() {
  const { t } = useTranslation(["profile", "common"]);
  return useMemo(
    () => ({
      success: (result) =>
        toast.success(
          t("profile:referral.applied", {
            amount: formatPrice(result?.rewards?.friend, { currency: result?.rewards?.currency }),
          }),
        ),
      failure: (error) =>
        toast.error(t("profile:referral.title"), { description: errorMessage(error) }),
    }),
    [t],
  );
}

export function usePendingReferral() {
  const authUser = useAuthStore((state) => state.authUser);
  const queryClient = useQueryClient();
  const notify = useReferralApplyToast();
  const attempted = useRef(null);
  const running = useRef(false);
  const [saved, setSaved] = useState(0);
  const userId = authUser?.role === "customer" ? authUser._id : null;

  useEffect(() => {
    const listener = () => {
      attempted.current = null;
      setSaved((n) => n + 1);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    if (!userId || attempted.current === userId || running.current) return;
    attempted.current = userId;
    running.current = true;

    (async () => {
      const code = await readPendingReferral();
      if (!code) return;
      try {
        const referral = await getMyReferral();
        if (!referral?.canApplyCode) {
          await clearPendingReferral();
          return;
        }
        const result = await applyReferralCode(code);
        await clearPendingReferral();
        queryClient.invalidateQueries({ queryKey: ["myVouchers"] });
        queryClient.invalidateQueries({ queryKey: MY_REFERRAL_KEY });
        notify.success(result);
      } catch (error) {
        if (!error?.response) return;
        await clearPendingReferral();
        notify.failure(error);
      }
    })().finally(() => {
      running.current = false;
    });
  }, [userId, saved, queryClient, notify]);
}
