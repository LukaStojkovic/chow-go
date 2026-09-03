import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/contexts/SocketContext";

const FALLBACK = {
  coords: null,
  accuracy: null,
  heading: null,
  speed: null,
  timestamp: null,
  error: null,
  isTracking: false,
  isDenied: false,
  isUnsupported: false,
};

const EMPTY_FIX = {
  coords: null,
  accuracy: null,
  heading: null,
  speed: null,
  timestamp: null,
  error: null,
  isDenied: false,
  isUnsupported: false,
};

const CourierLocationContext = createContext(null);

export function useCourierLocation() {
  return useContext(CourierLocationContext) ?? FALLBACK;
}

export function CourierLocationProvider({ children, enabled, activeOrderId }) {
  const { socket, isRegistered } = useSocket();

  const [fix, setFix] = useState(EMPTY_FIX);

  const isUnsupported =
    typeof navigator === "undefined" || !navigator.geolocation;

  const sinkRef = useRef(null);
  const orderIdRef = useRef(activeOrderId ?? null);
  const lastFixRef = useRef(null);

  useEffect(() => {
    sinkRef.current = isRegistered ? socket : null;
  }, [socket, isRegistered]);

  useEffect(() => {
    orderIdRef.current = activeOrderId ?? null;
  }, [activeOrderId]);

  useEffect(() => {
    if (!enabled || isUnsupported) return;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const next = {
          coords: [coords.latitude, coords.longitude],
          accuracy: coords.accuracy ?? null,
          heading: Number.isFinite(coords.heading) ? coords.heading : null,
          speed: Number.isFinite(coords.speed) ? coords.speed : null,
          timestamp,
        };

        lastFixRef.current = next;
        setFix({
          ...next,
          error: null,
          isDenied: false,
          isUnsupported: false,
        });

        sinkRef.current?.emit("courier:location_update", {
          coordinates: [coords.longitude, coords.latitude],
          orderId: orderIdRef.current ?? undefined,
        });
      },
      (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED;
        setFix((prev) => ({
          ...prev,
          error: isDenied
            ? "Location access is blocked. Enable it to navigate and to let the customer follow your delivery."
            : err.message,
          isDenied,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, isUnsupported]);

  useEffect(() => {
    if (!isRegistered || !socket || !enabled) return;
    const fix = lastFixRef.current;
    if (!fix) return;

    socket.emit("courier:location_update", {
      coordinates: [fix.coords[1], fix.coords[0]],
      orderId: activeOrderId ?? undefined,
    });
  }, [isRegistered, socket, enabled, activeOrderId]);

  const value = useMemo(
    () => ({
      ...fix,
      isUnsupported,
      error: isUnsupported
        ? "This device cannot report its location."
        : fix.error,
      isTracking: enabled && !fix.isDenied && !isUnsupported,
    }),
    [fix, enabled, isUnsupported],
  );

  return (
    <CourierLocationContext.Provider value={value}>
      {children}
    </CourierLocationContext.Provider>
  );
}
