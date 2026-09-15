import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice } from "@chowgo/shared/format";
import { useAuthStore } from "@/store/useAuthStore";

export const useGlobalSocketEvents = () => {
  const { socket, isConnected, connectionEpoch, register } = useSocket();
  const { authUser, checkAuth } = useAuthStore();
  const queryClient = useQueryClient();
  // The handlers close over `t`, so they are re-registered on a language
  // switch - a toast fired afterwards has to be in the new language.
  const { t } = useTranslation(["order", "seller", "common"]);

  useEffect(() => {
    if (!isConnected || !authUser) return;

    if (authUser.role === "customer") {
      register({ role: "customer" });
    } else if (authUser.role === "seller") {
      const restaurantId = authUser?.restaurant?.[0]?._id;
      if (restaurantId) {
        register({ role: "seller", restaurantId });
      }
    } else if (authUser.role === "courier") {
      register({ role: "courier" });
    }
  }, [isConnected, authUser, register]);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if (!socket || authUser?.role !== "customer") return;

    const upsertOrderCaches = (order) => {
      if (!order?._id) return;
      queryClient.setQueryData(["order", order._id], (prev) => {
        if (!prev) return prev;
        return { ...prev, data: { ...prev.data, order } };
      });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderConfirmed = (data) => {
      console.log("Order confirmed:", data);

      toast.success(t("order:notification.order_confirmed.title"), {
        description: t("order:notification.order_confirmed.body", {
          number: data.order?.orderNumber,
        }),
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_confirmed.title"), {
          body: t("order:notification.order_confirmed.body", {
            number: data.order?.orderNumber,
          }),
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderAssigned = (data) => {
      toast.success(t("order:notification.order_assigned.title"), {
        description: t("order:detail.numbered", { number: data.order?.orderNumber }),
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderPickedUp = (data) => {
      toast.info(t("order:notification.order_picked_up.title"), {
        description: t("order:detail.numbered", { number: data.order?.orderNumber }),
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderInTransit = (data) => {
      toast.info(t("order:notification.order_in_transit.title"), {
        description: t("order:detail.numbered", { number: data.order?.orderNumber }),
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderDelivered = (data) => {
      toast.success(t("order:notification.order_delivered.title"), {
        description: t("order:detail.numbered", { number: data.order?.orderNumber }),
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderRejected = (data) => {
      console.log("Order rejected:", data);

      toast.error(t("order:notification.order_rejected.title"), {
        description:
          data.reason ||
          t("order:notification.order_rejected.body", { number: data.order?.orderNumber }),
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_rejected.title"), {
          body: t("order:notification.rejectedWithReason", {
            number: data.order?.orderNumber,
            reason: data.reason || t("order:notification.noReason"),
          }),
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderPreparing = (data) => {
      console.log("Order preparing:", data);

      toast.info(t("order:notification.preparingBody"), {
        description: t("order:detail.numbered", { number: data.order?.orderNumber }),
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_preparing.title"), {
          body: t("order:notification.order_preparing.body", {
            number: data.order?.orderNumber,
          }),
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderReady = (data) => {
      console.log("Order ready:", data);

      toast.success(t("order:notification.order_ready.title"), {
        description: t("order:notification.readyForPickup", {
          number: data.order?.orderNumber,
        }),
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_ready.title"), {
          body: t("order:notification.readyForPickup", {
            number: data.order?.orderNumber,
          }),
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderCancelled = (data) => {
      console.log("Order cancelled:", data);

      toast.error(t("order:notification.order_cancelled.title"), {
        description:
          data.reason ||
          t("order:notification.order_cancelled.body", { number: data.order?.orderNumber }),
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_cancelled.title"), {
          body: t("order:notification.cancelledWithReason", {
            number: data.order?.orderNumber,
            reason: data.reason || t("order:notification.noReason"),
          }),
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    socket.on("order:confirmed", handleOrderConfirmed);
    socket.on("order:rejected", handleOrderRejected);
    socket.on("order:preparing", handleOrderPreparing);
    socket.on("order:ready", handleOrderReady);
    socket.on("order:cancelled", handleOrderCancelled);
    socket.on("order:assigned", handleOrderAssigned);
    socket.on("order:picked_up", handleOrderPickedUp);
    socket.on("order:in_transit", handleOrderInTransit);
    socket.on("order:delivered", handleOrderDelivered);

    return () => {
      socket.off("order:confirmed", handleOrderConfirmed);
      socket.off("order:rejected", handleOrderRejected);
      socket.off("order:preparing", handleOrderPreparing);
      socket.off("order:ready", handleOrderReady);
      socket.off("order:cancelled", handleOrderCancelled);
      socket.off("order:assigned", handleOrderAssigned);
      socket.off("order:picked_up", handleOrderPickedUp);
      socket.off("order:in_transit", handleOrderInTransit);
      socket.off("order:delivered", handleOrderDelivered);
    };
  }, [socket, authUser, queryClient, t]);

  useEffect(() => {
    if (!socket || authUser?.role !== "seller") return;

    const handleNewOrder = (data) => {
      console.log("New order received:", data);

      const audio = new Audio("/sounds/new-order.mp3");
      audio.play().catch((e) => console.log("Audio play failed:", e));

      const value = t("order:notification.newOrderValue", {
        number: data.order?.orderNumber,
        total: formatPrice(data.order?.total ?? 0),
      });

      toast.success(t("order:notification.order_placed.title"), {
        description: value,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_placed.title"), {
          body: value,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    };

    const handleOrderCancelled = (data) => {
      console.log("Order cancelled by customer:", data);

      const cancelled = t("order:notification.cancelledByCustomer", {
        number: data.order?.orderNumber,
      });

      toast.error(t("order:notification.order_cancelled.title"), {
        description: cancelled,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification(t("order:notification.order_cancelled.title"), {
          body: cancelled,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:cancelled", handleOrderCancelled);
    socket.on("order:assigned", () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    });
    socket.on("order:picked_up", () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    });
    socket.on("order:in_transit", () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    });
    socket.on("order:delivered", () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    });
    socket.on("order:courier_unassigned", () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    });

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:cancelled", handleOrderCancelled);
      socket.off("order:assigned");
      socket.off("order:picked_up");
      socket.off("order:in_transit");
      socket.off("order:delivered");
      socket.off("order:courier_unassigned");
    };
  }, [socket, authUser, queryClient, t]);

  useEffect(() => {
    if (!socket || authUser?.role !== "courier") return;

    const invalidateOwnOrders = () => {
      queryClient.invalidateQueries({ queryKey: ["courierOrders"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrder"] });
    };

    const invalidatePool = () => {
      queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
    };

    const refreshOwnOrders = () => {
      invalidateOwnOrders();
      invalidatePool();
      checkAuth();
    };

    socket.on("order:assigned", refreshOwnOrders);
    socket.on("order:picked_up", invalidateOwnOrders);
    socket.on("order:in_transit", invalidateOwnOrders);
    socket.on("order:delivered", refreshOwnOrders);
    socket.on("order:courier_unassigned", refreshOwnOrders);

    socket.on("order:available", invalidatePool);
    socket.on("order:taken", invalidatePool);

    return () => {
      socket.off("order:assigned", refreshOwnOrders);
      socket.off("order:picked_up", invalidateOwnOrders);
      socket.off("order:in_transit", invalidateOwnOrders);
      socket.off("order:delivered", refreshOwnOrders);
      socket.off("order:courier_unassigned", refreshOwnOrders);
      socket.off("order:available", invalidatePool);
      socket.off("order:taken", invalidatePool);
    };
  }, [socket, authUser, queryClient, checkAuth]);

  useEffect(() => {
    if (connectionEpoch < 2 || !authUser) return;

    if (authUser.role === "customer") {
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    } else if (authUser.role === "seller") {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    } else if (authUser.role === "courier") {
      queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrders"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrder"] });
    }
  }, [connectionEpoch, authUser, queryClient]);

  return { isConnected };
};
