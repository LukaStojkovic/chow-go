import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/realtime/SocketProvider";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Escalating haptics until the seller acts.
 *
 * A toast is the wrong shape for a new order: it is the one event in the
 * product that must interrupt, because ignoring it costs the restaurant money
 * and the customer their dinner. The takeover screen does the interrupting;
 * this makes sure it is felt as well as seen.
 */
const PULSES = 6;
const PULSE_GAP_MS = 700;

// Module-level so the takeover screen can silence it the moment the seller
// acts, rather than buzzing on for another three seconds.
let pulseTimers = [];

export function silenceAlert() {
  pulseTimers.forEach(clearTimeout);
  pulseTimers = [];
}

function startPulsing() {
  silenceAlert();
  pulseTimers = Array.from({ length: PULSES }, (_, index) =>
    setTimeout(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      index * PULSE_GAP_MS,
    ),
  );
}

export function SellerAlert() {
  const { socket } = useSocket();
  const role = useAuthStore((state) => state.authUser?.role);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || role !== "seller") return;

    const handleNewOrder = (payload) => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });

      const orderId = payload?.order?._id;
      if (!orderId) return;

      startPulsing();
      router.push(`/(seller)/incoming/${orderId}`);
    };

    socket.on("order:new", handleNewOrder);
    return () => {
      socket.off("order:new", handleNewOrder);
      silenceAlert();
    };
  }, [socket, role, queryClient]);

  return null;
}
