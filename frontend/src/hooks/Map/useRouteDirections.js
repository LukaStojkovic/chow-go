import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDrivingRoute } from "@/services/routingService";
import { haversineMeters } from "@/utils/mapUtils";

const ROUTE_REFRESH_MS = 45000;
const REROUTE_DEVIATION_M = 120;
const ROUTE_RETRY_MS = 8000;

export function useRouteDirections(from, to, enabled = true) {
  const [route, setRoute] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [failureCount, setFailureCount] = useState(0);

  const lastOriginRef = useRef(null);
  const fromRef = useRef(from);
  fromRef.current = from;
  const toRef = useRef(to);
  toRef.current = to;

  const requestIdRef = useRef(0);

  const toKey = to ? `${to[0]},${to[1]}` : null;
  const fromLat = from?.[0];
  const fromLng = from?.[1];

  const loadRoute = useCallback(
    async (origin, force = false) => {
      const destination = toRef.current;
      if (!enabled || !origin || !destination) return;

      if (
        !force &&
        lastOriginRef.current &&
        haversineMeters(lastOriginRef.current, origin) < REROUTE_DEVIATION_M
      ) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoadingRoute(true);

      try {
        const result = await fetchDrivingRoute(origin, destination);
        if (requestId !== requestIdRef.current) return;

        if (result) {
          lastOriginRef.current = origin;
          setRoute(result);
          setRouteError(null);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error("Route fetch error:", err);
        setRouteError(err?.message ?? "Failed to fetch route");
        setFailureCount((n) => n + 1);
      } finally {
        if (requestId === requestIdRef.current) setIsLoadingRoute(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    requestIdRef.current += 1;
    setRoute(null);
    setRouteError(null);
    lastOriginRef.current = null;

    if (!enabled || !toKey) {
      setIsLoadingRoute(false);
      return;
    }
    if (fromRef.current) loadRoute(fromRef.current, true);
  }, [toKey, enabled, loadRoute]);

  useEffect(() => {
    if (!enabled || fromLat == null || fromLng == null) return;
    loadRoute([fromLat, fromLng], false);
  }, [fromLat, fromLng, enabled, loadRoute]);

  useEffect(() => {
    if (!enabled || !toKey) return;
    const interval = setInterval(
      () => loadRoute(fromRef.current, true),
      ROUTE_REFRESH_MS,
    );
    return () => clearInterval(interval);
  }, [enabled, toKey, loadRoute]);

  useEffect(() => {
    if (!enabled || !routeError || failureCount === 0) return;
    const timeout = setTimeout(
      () => loadRoute(fromRef.current, true),
      ROUTE_RETRY_MS,
    );
    return () => clearTimeout(timeout);
  }, [enabled, routeError, failureCount, loadRoute]);

  return { route, isLoadingRoute, routeError };
}
