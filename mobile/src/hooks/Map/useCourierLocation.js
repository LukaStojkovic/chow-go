import { useEffect, useState } from "react";
import { toLatLng } from "@chowgo/shared/geo";
import { useSocket } from "@/realtime/SocketProvider";

const STALE_AFTER_MS = 90_000;

// Seeds from whatever the order already carries, then follows the socket.
// courier:location is high-frequency and order-scoped, so it is handled here
// rather than in useGlobalSocketEvents - it updates a marker, not a cache.
export function useCourierLocation(orderId, seed) {
  const { socket } = useSocket();
  const [position, setPosition] = useState(() => toLatLng(seed));
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    setPosition(toLatLng(seed));
  }, [seed]);

  useEffect(() => {
    if (!socket || !orderId) return;

    const handler = (payload) => {
      if (String(payload.orderId) !== String(orderId)) return;
      const next = toLatLng(payload.coordinates);
      if (next) {
        setPosition(next);
        setUpdatedAt(Date.now());
      }
    };

    socket.on("courier:location", handler);
    return () => socket.off("courier:location", handler);
  }, [socket, orderId]);

  const isStale = updatedAt != null && Date.now() - updatedAt > STALE_AFTER_MS;
  return { position, updatedAt, isStale };
}
