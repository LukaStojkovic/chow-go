import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { apiErrorMessage } from "@/lib/apiError";
import { getRestaurantStatus, setRestaurantStatus } from "@/services/apiRestaurantStatus";
import { useAuthStore } from "@/store/useAuthStore";

export const RESTAURANT_STATUS_KEY = ["restaurantStatus"];

const MAX_TIMEOUT = 2 ** 31 - 1;

function nextExpiry(status) {
  const times = [status?.pause?.indefinite ? null : status?.pause?.until, status?.busy?.until]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((ms) => Number.isFinite(ms));
  return times.length ? Math.min(...times) : null;
}

export function useRestaurantStatus() {
  const queryClient = useQueryClient();
  const enabled = useAuthStore(
    (state) => state.authUser?.role === "seller" && Boolean(state.authUser?.restaurant?.[0]?._id),
  );
  const query = useQuery({ queryKey: RESTAURANT_STATUS_KEY, queryFn: getRestaurantStatus, enabled });

  const expiry = nextExpiry(query.data);
  useEffect(() => {
    if (!expiry) return undefined;
    const delay = Math.min(Math.max(expiry - Date.now() + 1000, 1000), MAX_TIMEOUT);
    const id = setTimeout(() => queryClient.invalidateQueries({ queryKey: RESTAURANT_STATUS_KEY }), delay);
    return () => clearTimeout(id);
  }, [expiry, queryClient]);

  return query;
}

const successKey = {
  pause: "seller:status.toast.paused",
  resume: "seller:status.toast.resumed",
  busy: "seller:status.toast.busy",
  normal: "seller:status.toast.normal",
};

export function useSetRestaurantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => setRestaurantStatus(body),
    onSuccess: (data, body) => {
      queryClient.setQueryData(RESTAURANT_STATUS_KEY, data);
      toast.success(t(successKey[body.action]));
    },
    onError: (err) => toast.error(apiErrorMessage(err, { fallbackKey: "seller:status.toast.failed" })),
  });
}
