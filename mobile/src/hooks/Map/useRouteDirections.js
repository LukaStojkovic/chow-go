import { useCallback, useEffect, useRef, useState } from "react";
import { haversineMeters } from "@chowgo/shared/geo";
import { fetchDrivingRoute } from "@/services/routingService";

const REFRESH_MS = 45_000;
// Re-routing on every GPS tick would hammer a public demo server for a line
// that barely moves; only a real deviation is worth a new request.
const DEVIATION_M = 120;
const RETRY_MS = 8_000;

/**
 * The driving line between two points, kept current as the origin moves.
 *
 * Three things trigger a fetch: a new destination (forced), the origin drifting
 * further than DEVIATION_M from wherever the current line was drawn from, and a
 * timer, because traffic changes the ETA even when nobody has moved. A failed
 * fetch retries once on a short delay rather than waiting out the full refresh
 * - a courier staring at a blank route for 45 seconds will just open Google
 * Maps instead.
 */
export function useRouteDirections(from, to, enabled = true) {
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failures, setFailures] = useState(0);

  const lastOrigin = useRef(null);
  const requestId = useRef(0);

  const fromRef = useRef(from);
  fromRef.current = from;
  const toRef = useRef(to);
  toRef.current = to;

  const load = useCallback(
    async (origin, force = false) => {
      const destination = toRef.current;
      if (!enabled || !origin || !destination) return;

      if (
        !force &&
        lastOrigin.current &&
        haversineMeters(lastOrigin.current, origin) < DEVIATION_M
      ) {
        return;
      }

      // Fixes arrive faster than OSRM answers, so a stale response must not
      // overwrite a newer line.
      const id = ++requestId.current;
      setIsLoading(true);

      const result = await fetchDrivingRoute(origin, destination);
      if (id !== requestId.current) return;

      if (result) {
        lastOrigin.current = origin;
        setRoute(result);
        setError(null);
      } else {
        setError("Route unavailable");
        setFailures((count) => count + 1);
      }
      setIsLoading(false);
    },
    [enabled],
  );

  const toLat = to?.[0];
  const toLng = to?.[1];
  const fromLat = from?.[0];
  const fromLng = from?.[1];

  // A new destination invalidates the whole line, not just its origin.
  useEffect(() => {
    requestId.current += 1;
    setRoute(null);
    setError(null);
    setIsLoading(false);
    lastOrigin.current = null;

    if (enabled && toLat != null && fromRef.current) load(fromRef.current, true);
  }, [toLat, toLng, enabled, load]);

  useEffect(() => {
    if (fromLat == null || fromLng == null) return;
    load([fromLat, fromLng], false);
  }, [fromLat, fromLng, load]);

  useEffect(() => {
    if (!enabled || toLat == null) return;
    const timer = setInterval(() => load(fromRef.current, true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [enabled, toLat, toLng, load]);

  useEffect(() => {
    if (!enabled || !error || failures === 0) return;
    const timer = setTimeout(() => load(fromRef.current, true), RETRY_MS);
    return () => clearTimeout(timer);
  }, [enabled, error, failures, load]);

  return { route, isLoading, error };
}
