import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { toLatLng } from "@/utils/mapUtils";

export function useOrderCourierLocation(orderId, courier) {
  const { socket } = useSocket();
  const [coords, setCoords] = useState(() =>
    toLatLng(courier?.currentLocation?.coordinates),
  );

  useEffect(() => {
    const initial = toLatLng(courier?.currentLocation?.coordinates);
    if (initial) setCoords(initial);
  }, [courier?.currentLocation?.coordinates?.[0], courier?.currentLocation?.coordinates?.[1]]);

  useEffect(() => {
    if (!socket || !orderId) return;

    const handler = (data) => {
      if (String(data.orderId) !== String(orderId)) return;
      const next = toLatLng(data.courier?.currentLocation?.coordinates);
      if (next) setCoords(next);
    };

    socket.on("courier:location", handler);
    return () => socket.off("courier:location", handler);
  }, [socket, orderId]);

  return coords;
}
