import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { useSocket } from "@/realtime/SocketProvider";

/**
 * Streams the courier's position while a delivery is active, and hands the same
 * fix back for the screen to draw with.
 *
 * One watch, two consumers: the customer's live map is fed over the socket, and
 * the courier's own navigation reads the return value. A second
 * `watchPositionAsync` for the UI would double the GPS duty cycle for a
 * position this one already has.
 *
 * The server throttles to one database write every three seconds per courier,
 * so the emit rate below is about what the route line needs, not what the
 * database can take. Foreground only: keeping this alive with the screen off
 * needs a TaskManager task, an Android foreground service and a Play Store
 * declaration, which is its own change.
 */
const DISTANCE_INTERVAL_M = 10;
const TIME_INTERVAL_MS = 4000;

const IDLE = {
  position: null,
  heading: null,
  speed: null,
  accuracy: null,
  updatedAt: null,
  isDenied: false,
};

export function useCourierLocationBroadcast(orderId) {
  const { socket, isRegistered } = useSocket();
  const [fix, setFix] = useState(IDLE);

  // The socket can connect, drop and re-register underneath a watch that is
  // already running, so the emit reads it from a ref rather than closing over
  // whichever instance existed when the watch started.
  const sink = useRef(null);
  useEffect(() => {
    sink.current = isRegistered ? socket : null;
  }, [socket, isRegistered]);

  useEffect(() => {
    if (!orderId) {
      setFix(IDLE);
      return;
    }

    let subscription = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") {
        setFix({ ...IDLE, isDenied: true });
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: DISTANCE_INTERVAL_M,
          timeInterval: TIME_INTERVAL_MS,
        },
        ({ coords, timestamp }) => {
          setFix({
            position: [coords.latitude, coords.longitude],
            heading: Number.isFinite(coords.heading) && coords.heading >= 0 ? coords.heading : null,
            speed: Number.isFinite(coords.speed) ? coords.speed : null,
            accuracy: coords.accuracy ?? null,
            updatedAt: timestamp ?? Date.now(),
            isDenied: false,
          });

          // GeoJSON order, matching every other coordinate the API handles.
          sink.current?.emit("courier:location_update", {
            coordinates: [coords.longitude, coords.latitude],
            orderId,
          });
        },
      );

      if (cancelled) subscription.remove();
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [orderId]);

  return {
    ...fix,
    // Watching, permitted, and something has actually come back.
    isTracking: Boolean(orderId) && !fix.isDenied,
  };
}
