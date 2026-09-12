import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { registerForPush } from "./register";
import { useAuthStore } from "@/store/useAuthStore";

Notifications.setNotificationHandler({
  // The backend only pushes when the socket room was empty. So a push arriving
  // while the app is in the foreground means the socket silently dropped - a
  // carrier handover, a Wi-Fi flap - which is precisely the case where no
  // in-app toast fires either. Suppressing the banner here, as this used to,
  // meant a sound and a tray entry and nothing on screen.
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// The payload carries no role, so the signed-in user's decides where a tap
// lands. This used to always build a customer route, which dropped a seller
// into (customer) - a group with no role guard - where the request then 403'd.
function routeFor(data, role) {
  if (!data?.orderId) return null;

  if (role === "seller") return `/(seller)/incoming/${data.orderId}`;
  if (role === "courier") return `/(courier)/delivery/${data.orderId}`;
  if (role === "customer") return `/(customer)/order/${data.orderId}`;
  return null;
}

export function usePushNotifications() {
  const authUser = useAuthStore((state) => state.authUser);
  const role = authUser?.role;
  const queryClient = useQueryClient();
  const handled = useRef(null);

  useEffect(() => {
    if (!authUser) return;
    registerForPush();
  }, [authUser]);

  // shouldSetBadge raises the count; nothing ever lowered it, so the icon badge
  // climbed monotonically and never reset no matter how much the user read.
  useEffect(() => {
    const clear = () => Notifications.setBadgeCountAsync(0).catch(() => {});
    clear();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") clear();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Arriving while the app is open means the socket may have missed it.
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const { orderId } = notification.request.content.data ?? {};
      if (orderId) queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({
        queryKey:
          role === "seller"
            ? ["restaurantOrders"]
            : role === "courier"
              ? ["courierOrders"]
              : ["customerOrders"],
      });
    });

    const tapped = Notifications.addNotificationResponseReceivedListener((response) => {
      const href = routeFor(response.notification.request.content.data, role);
      if (href) router.push(href);
    });

    // A notification that launched the app from cold start is not delivered to
    // the listener above, so it has to be read once on mount.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      handled.current = id;

      const href = routeFor(response.notification.request.content.data, role);
      if (href) router.push(href);
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [queryClient, role]);
}
