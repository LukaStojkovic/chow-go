import { useEffect, useRef, useState } from "react";
import {
  COURIER_MOTION,
  glideDurationMs,
  haversineMeters,
  isSamePosition,
  lerpLatLng,
  nextHeading,
  shortestRotation,
} from "@chowgo/shared/geo";
import { useMotion } from "@/theme/motion";

const FRAME_MS = 33;

// Glides a live marker from fix to fix and turns it to face the way it is
// going. The rules are shared with the web (@chowgo/shared/geo).
export function useSmoothPosition(target) {
  const { isReduced } = useMotion();
  const [state, setState] = useState({ position: target ?? null, rotation: null });
  const rendered = useRef(target ?? null);
  const rotation = useRef(null);
  const lastFix = useRef(null);
  const frame = useRef(null);

  const lat = target?.[0];
  const lng = target?.[1];

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    if (lat == null || lng == null) {
      rendered.current = null;
      setState({ position: null, rotation: rotation.current });
      return undefined;
    }

    const to = [lat, lng];
    const from = rendered.current;
    const now = Date.now();
    const duration = glideDurationMs(lastFix.current == null ? undefined : now - lastFix.current);
    lastFix.current = now;

    const heading = nextHeading(from, to, null);
    if (heading != null) rotation.current = shortestRotation(rotation.current, heading);

    if (!from || isReduced || haversineMeters(from, to) > COURIER_MOTION.snapMeters || isSamePosition(from, to)) {
      rendered.current = to;
      setState({ position: to, rotation: rotation.current });
      return undefined;
    }

    let painted = 0;
    const step = () => {
      const elapsed = Date.now() - now;
      const t = Math.min(1, elapsed / duration);
      const position = lerpLatLng(from, to, t);
      rendered.current = position;
      if (t === 1 || elapsed - painted >= FRAME_MS) {
        painted = elapsed;
        setState({ position, rotation: rotation.current });
      }
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [lat, lng, isReduced]);

  return state;
}
