import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./SocketProvider";
import { toast } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";

// The single place that registers the socket role and invalidates caches, same
// rule as the web. New realtime state must be wired here or the UI won't update.

const CUSTOMER_KEYS = [["order"], ["customerOrders"]];
const COURIER_KEYS = [["courierOrders"], ["courierOrder"], ["courierAvailableOrders"]];
const SELLER_KEYS = [["restaurantOrders"]];

export function useGlobalSocketEvents() {
  const { socket, isConnected, connectionEpoch, register } = useSocket();
  const { authUser, checkAuth } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected || !authUser) return;

    if (authUser.role === "customer") {
      register({ role: "customer" });
    } else if (authUser.role === "seller") {
      const restaurantId = authUser?.restaurant?.[0]?._id;
      if (restaurantId) register({ role: "seller", restaurantId });
    } else if (authUser.role === "courier") {
      register({ role: "courier" });
    }
  }, [isConnected, authUser, register]);

  useEffect(() => {
    if (!socket || authUser?.role !== "customer") return;

    const invalidate = (keys) =>
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

    // The socket payload already carries a fully populated order, so write it
    // straight into the detail cache instead of triggering a refetch. The shape
    // must match apiOrder.getOrderById, which unwraps to a bare order - writing
    // the API's {data:{order}} envelope would leave the screen reading fields
    // that are not where it looks. Only when an entry already exists: seeding
    // one would cache a shape the detail query never produced.
    const upsertOrder = (order) => {
      if (!order?._id) return;
      queryClient.setQueryData(["order", order._id], (previous) => (previous ? order : previous));
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const announce = (tone, title, order, extra) => {
      toast[tone](title, {
        description: extra ?? (order?.orderNumber ? `Order #${order.orderNumber}` : undefined),
      });
      Haptics.notificationAsync(
        tone === "error"
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Success,
      );
    };

    const handlers = {
      "order:confirmed": (data) => {
        announce("success", "Order confirmed", data.order);
        invalidate(CUSTOMER_KEYS);
      },
      "order:rejected": (data) => {
        announce("error", "Order rejected", data.order, data.reason);
        invalidate(CUSTOMER_KEYS);
      },
      "order:preparing": (data) => {
        announce("info", "Your order is being prepared", data.order);
        invalidate(CUSTOMER_KEYS);
      },
      "order:ready": (data) => {
        announce("info", "Your order is ready", data.order);
        invalidate(CUSTOMER_KEYS);
      },
      "order:cancelled": (data) => {
        announce("error", "Order cancelled", data.order, data.reason);
        invalidate(CUSTOMER_KEYS);
      },
      "order:assigned": (data) => {
        announce("success", "Courier assigned", data.order);
        upsertOrder(data.order);
      },
      "order:picked_up": (data) => {
        announce("info", "Picked up", data.order);
        upsertOrder(data.order);
      },
      "order:in_transit": (data) => {
        announce("info", "On the way", data.order);
        upsertOrder(data.order);
      },
      "order:delivered": (data) => {
        announce("success", "Delivered", data.order);
        upsertOrder(data.order);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, authUser?.role, queryClient]);

  useEffect(() => {
    if (!socket || authUser?.role !== "seller") return;

    const refresh = () =>
      SELLER_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

    const handleNewOrder = (data) => {
      toast.success("New order", {
        description: data.order?.orderNumber ? `Order #${data.order.orderNumber}` : undefined,
        duration: 8000,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
    };

    const events = [
      "order:cancelled",
      "order:assigned",
      "order:picked_up",
      "order:in_transit",
      "order:delivered",
      "order:courier_unassigned",
    ];

    socket.on("order:new", handleNewOrder);
    events.forEach((event) => socket.on(event, refresh));

    return () => {
      socket.off("order:new", handleNewOrder);
      events.forEach((event) => socket.off(event, refresh));
    };
  }, [socket, authUser?.role, queryClient]);

  useEffect(() => {
    if (!socket || authUser?.role !== "courier") return;

    const refreshAll = () =>
      COURIER_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    // Duty state and earnings live on the user document, not on an order.
    const refreshWithProfile = () => {
      refreshAll();
      checkAuth();
    };
    const refreshPool = () =>
      queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });

    const bindings = [
      ["order:assigned", refreshWithProfile],
      ["order:delivered", refreshWithProfile],
      ["order:courier_unassigned", refreshWithProfile],
      ["order:picked_up", refreshAll],
      ["order:in_transit", refreshAll],
      ["order:available", refreshPool],
      ["order:taken", refreshPool],
    ];

    bindings.forEach(([event, handler]) => socket.on(event, handler));
    return () => bindings.forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, authUser?.role, queryClient, checkAuth]);

  // A reconnect means events were dropped while offline - they are never queued.
  useEffect(() => {
    if (connectionEpoch < 2 || !authUser) return;

    const keys =
      authUser.role === "seller"
        ? SELLER_KEYS
        : authUser.role === "courier"
          ? COURIER_KEYS
          : CUSTOMER_KEYS;

    keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
  }, [connectionEpoch, authUser, queryClient]);
}
