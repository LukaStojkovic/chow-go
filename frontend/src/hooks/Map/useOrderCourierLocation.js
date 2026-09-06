import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { toLatLng } from "@chowgo/shared/geo";

const STALE_AFTER_MS = 90_000;

const toTimestamp = (value) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export function useOrderCourierLocation(orderId, courier) {
  const { socket } = useSocket();

  const [state, setState] = useState(() => ({
    coords: toLatLng(courier?.currentLocation?.coordinates),
    timestamp: toTimestamp(courier?.lastLocationUpdate),
  }));

  const storedLng = courier?.currentLocation?.coordinates?.[0];
  const storedLat = courier?.currentLocation?.coordinates?.[1];
  const storedAt = courier?.lastLocationUpdate;

  const seenOrderRef = useRef(orderId);

  useEffect(() => {
    const seeded = toLatLng(
      storedLng == null || storedLat == null ? null : [storedLng, storedLat],
    );
    const seededAt = toTimestamp(storedAt);

    const isNewOrder = seenOrderRef.current !== orderId;
    seenOrderRef.current = orderId;

    setState((prev) => {
      if (isNewOrder) return { coords: seeded, timestamp: seededAt };
      if (!seeded) return prev.coords ? { coords: null, timestamp: null } : prev;

      if (prev.timestamp && seededAt && seededAt <= prev.timestamp) return prev;
      return { coords: seeded, timestamp: seededAt };
    });
  }, [orderId, storedLng, storedLat, storedAt]);

  useEffect(() => {
    if (!socket || !orderId) return;

    const handler = (data) => {
      if (String(data.orderId) !== String(orderId)) return;
      const next = toLatLng(data.coordinates);
      if (!next) return;
      setState({ coords: next, timestamp: data.timestamp ?? Date.now() });
    };

    socket.on("courier:location", handler);
    return () => socket.off("courier:location", handler);
  }, [socket, orderId]);

  const [staleAt, setStaleAt] = useState(null);

  useEffect(() => {
    if (state.coords == null || state.timestamp == null) return;
    const remaining = Math.max(0, STALE_AFTER_MS - (Date.now() - state.timestamp));
    const timeout = setTimeout(() => setStaleAt(state.timestamp), remaining);
    return () => clearTimeout(timeout);
  }, [state.coords, state.timestamp]);

  return {
    coords: state.coords,
    timestamp: state.timestamp,
    isStale: staleAt != null && staleAt === state.timestamp,
  };
}
