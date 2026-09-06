import { useEffect } from "react";
import * as Location from "expo-location";
import { useSocket } from "@/realtime/SocketProvider";

/**
 * Streams the courier's position while a delivery is active.
 *
 * The server throttles to one database write every three seconds per courier,
 * so a tighter interval here would only burn battery. Foreground only: keeping
 * this alive with the screen off needs a TaskManager task, an Android
 * foreground service and a Play Store declaration, which is its own change.
 */
const DISTANCE_INTERVAL_M = 25;
const TIME_INTERVAL_MS = 5000;

export function useCourierLocationBroadcast(orderId) {
  const { socket, isRegistered } = useSocket();

  useEffect(() => {
    if (!socket || !isRegistered || !orderId) return;

    let subscription = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: DISTANCE_INTERVAL_M,
          timeInterval: TIME_INTERVAL_MS,
        },
        ({ coords }) => {
          // GeoJSON order, matching every other coordinate the API handles.
          socket.emit("courier:location_update", {
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
  }, [socket, isRegistered, orderId]);
}
