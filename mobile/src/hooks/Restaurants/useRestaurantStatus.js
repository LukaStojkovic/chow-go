import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRestaurantStatus, setRestaurantStatus } from "@/services/apiRestaurantStatus";
import { useOwnRestaurantId } from "./useMenuItems";

export const RESTAURANT_STATUS_KEY = ["restaurantStatus"];

const time = (value) => (value ? new Date(value).getTime() : NaN);

export function effectiveStatus(data, now = Date.now()) {
  if (!data) return null;
  const pauseUntil = time(data.pause?.until);
  const pause = data.pause && (data.pause.indefinite || pauseUntil > now) ? data.pause : null;
  const busyUntil = time(data.busy?.until);
  const busy = data.busy?.extraMinutes > 0 && busyUntil > now ? data.busy : null;

  let kind = "open";
  if (!data.isActive) kind = "inactive";
  else if (pause) kind = "paused";
  else if (data.closure) kind = "holiday";
  else if (data.scheduleOpen === false) kind = "closed";
  else if (busy) kind = "busy";

  return { kind, pause, busy, extraMinutes: busy?.extraMinutes ?? 0 };
}

function nextExpiry(data, now) {
  const times = [time(data?.pause?.until), time(data?.busy?.until)].filter((value) => value > now);
  return times.length ? Math.min(...times) : null;
}

export function useRestaurantStatus() {
  const restaurantId = useOwnRestaurantId();
  const query = useQuery({
    queryKey: RESTAURANT_STATUS_KEY,
    queryFn: getRestaurantStatus,
    enabled: Boolean(restaurantId),
  });
  const { data, refetch } = query;

  useEffect(() => {
    const at = nextExpiry(data, Date.now());
    if (!at) return undefined;
    const timer = setTimeout(() => refetch(), Math.min(at - Date.now() + 1000, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [data, refetch]);

  return query;
}

export function useSetRestaurantStatus() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnRestaurantId();

  return useMutation({
    mutationFn: setRestaurantStatus,
    onSuccess: (status) => {
      queryClient.setQueryData(RESTAURANT_STATUS_KEY, status);
      queryClient.invalidateQueries({ queryKey: ["ownRestaurant", restaurantId] });
    },
  });
}
