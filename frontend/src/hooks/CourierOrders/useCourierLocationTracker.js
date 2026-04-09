import { useEffect, useMemo, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";

export function useCourierLocationTracker(activeOrderId) {
  const { socket, isConnected } = useSocket();
  const watchIdRef = useRef(null);
  const lastSentRef = useRef({ lat: null, lng: null, ts: 0 });

  const canTrack = useMemo(() => {
    return !!socket && isConnected && !!activeOrderId;
  }, [socket, isConnected, activeOrderId]);

  useEffect(() => {
    if (!canTrack) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const minIntervalMs = 3500;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = Date.now();

        const prev = lastSentRef.current;
        const moved =
          prev.lat == null ||
          prev.lng == null ||
          Math.abs(prev.lat - lat) > 0.00005 ||
          Math.abs(prev.lng - lng) > 0.00005;

        if (!moved && now - prev.ts < minIntervalMs) return;
        if (now - prev.ts < minIntervalMs) return;

        lastSentRef.current = { lat, lng, ts: now };

        socket.emit(
          "courier:location:update",
          { orderId: activeOrderId, lat, lng },
          () => {},
        );
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [canTrack, socket, activeOrderId]);
}

