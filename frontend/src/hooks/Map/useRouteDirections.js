import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDrivingRoute } from "@/services/routingService";
import { haversineMeters } from "@/utils/mapUtils";

const ROUTE_REFRESH_MS = 45000;
const REROUTE_DEVIATION_M = 120;

export function useRouteDirections(from, to, enabled = true) {
  const [route, setRoute] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const lastFromRef = useRef(null);
  const fromRef = useRef(from);
  fromRef.current = from;

  const loadRoute = useCallback(
    async (origin, force = false) => {
      if (!enabled || !origin || !to) return;

      if (
        !force &&
        lastFromRef.current &&
        haversineMeters(lastFromRef.current, origin) < REROUTE_DEVIATION_M
      ) {
        return;
      }

      setIsLoadingRoute(true);
      try {
        const result = await fetchDrivingRoute(origin, to);
        if (result) {
          lastFromRef.current = origin;
          setRoute(result);
        }
      } catch (err) {
        console.error("Route fetch error:", err);
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [enabled, to?.[0], to?.[1]],
  );

  useEffect(() => {
    if (!enabled || !to) {
      setRoute(null);
      lastFromRef.current = null;
      return;
    }
    if (from) loadRoute(from, true);
  }, [to?.[0], to?.[1], enabled, loadRoute]);

  useEffect(() => {
    if (!enabled || !from) return;
    loadRoute(from, false);
  }, [from?.[0], from?.[1], enabled, loadRoute]);

  useEffect(() => {
    if (!enabled || !to) return;
    const interval = setInterval(
      () => loadRoute(fromRef.current, false),
      ROUTE_REFRESH_MS,
    );
    return () => clearInterval(interval);
  }, [enabled, to?.[0], to?.[1], loadRoute]);

  return { route, isLoadingRoute };
}
