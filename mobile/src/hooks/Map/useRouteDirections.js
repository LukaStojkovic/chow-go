import { useEffect, useRef, useState } from "react";
import { haversineMeters } from "@chowgo/shared/geo";
import { fetchDrivingRoute } from "@/services/routingService";

const REFRESH_MS = 45_000;
// Re-routing on every GPS tick would hammer a public demo server for a line
// that barely moves; only a real deviation is worth a new request.
const DEVIATION_M = 120;

export function useRouteDirections(from, to) {
  const [route, setRoute] = useState(null);
  const lastOrigin = useRef(null);

  useEffect(() => {
    if (!from || !to) return;

    let cancelled = false;

    async function load() {
      const result = await fetchDrivingRoute(from, to);
      if (!cancelled && result) {
        setRoute(result);
        lastOrigin.current = from;
      }
    }

    const moved = !lastOrigin.current || haversineMeters(lastOrigin.current, from) > DEVIATION_M;
    if (moved || !route) load();

    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // `route` is deliberately not a dependency: it is what this sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  return route;
}
