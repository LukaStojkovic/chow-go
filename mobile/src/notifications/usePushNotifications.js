import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { registerForPush } from "./register";
import { useAuthStore } from "@/store/useAuthStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // The socket already drives an in-app toast, so a banner on top of it would
    // say the same thing twice. Sound and badge still fire.
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function routeFor(data) {
  if (data?.orderId) return `/(customer)/order/${data.orderId}`;
  return null;
}

export function usePushNotifications() {
  const authUser = useAuthStore((state) => state.authUser);
  const queryClient = useQueryClient();
  const handled = useRef(null);

  useEffect(() => {
    if (!authUser) return;
    registerForPush();
  }, [authUser]);

  useEffect(() => {
    // Arriving while the app is open means the socket may have missed it.
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const { orderId } = notification.request.content.data ?? {};
      if (orderId) queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    });

    const tapped = Notifications.addNotificationResponseReceivedListener((response) => {
      const href = routeFor(response.notification.request.content.data);
      if (href) router.push(href);
    });

    // A notification that launched the app from cold start is not delivered to
    // the listener above, so it has to be read once on mount.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      handled.current = id;

      const href = routeFor(response.notification.request.content.data);
      if (href) router.push(href);
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [queryClient]);
}
