import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export const useGlobalSocketEvents = () => {
  const { socket, isConnected, register } = useSocket();
  const { authUser } = useAuthStore();
  const queryClient = useQueryClient();

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
      console.log("✅ Order confirmed:", data);

      toast.success("Order Confirmed!", {
        description: `Order #${data.order?.orderNumber} has been confirmed`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("Order Confirmed! 🎉", {
          body: `Your order #${data.order?.orderNumber} has been confirmed by the restaurant`,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderAssigned = (data) => {
      toast.success("Courier Assigned", {
        description: `Order #${data.order?.orderNumber}`,
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderPickedUp = (data) => {
      toast.info("Picked Up", {
        description: `Order #${data.order?.orderNumber}`,
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderInTransit = (data) => {
      toast.info("On the way", {
        description: `Order #${data.order?.orderNumber}`,
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleOrderDelivered = (data) => {
      toast.success("Delivered", {
        description: `Order #${data.order?.orderNumber}`,
        duration: 4000,
      });
      upsertOrderCaches(data.order);
    };

    const handleCourierLocation = (data) => {
      const { orderId, courier } = data || {};
      if (!orderId || !courier) return;

      queryClient.setQueryData(["order", orderId], (prev) => {
        const prevOrder = prev?.data?.order;
        if (!prevOrder) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            order: {
              ...prevOrder,
              courier: {
                ...prevOrder.courier,
                currentLocation: courier.currentLocation,
                lastLocationUpdate: courier.lastLocationUpdate,
              },
            },
          },
        };
      });
    };

    const handleOrderRejected = (data) => {
      console.log("❌ Order rejected:", data);

      toast.error("Order Rejected", {
        description: data.reason || "Your order was rejected by the restaurant",
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("Order Rejected ❌", {
          body: `Your order #${data.order?.orderNumber} was rejected: ${data.reason || "No reason provided"}`,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderPreparing = (data) => {
      console.log("👨‍🍳 Order preparing:", data);

      toast.info("Your order is being prepared", {
        description: `Order #${data.order?.orderNumber}`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("Order Preparing 👨‍🍳", {
          body: `Your order #${data.order?.orderNumber} is being prepared`,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderReady = (data) => {
      console.log("📦 Order ready:", data);

      toast.success("Order Ready!", {
        description: `Order #${data.order?.orderNumber} is ready for pickup`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("Order Ready! 📦", {
          body: `Your order #${data.order?.orderNumber} is ready for pickup`,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    };

    const handleOrderCancelled = (data) => {
      console.log("❌ Order cancelled:", data);

      toast.error("Order Cancelled", {
        description:
          data.reason || `Order #${data.order?.orderNumber} was cancelled`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("Order Cancelled ❌", {
          body: `Your order #${data.order?.orderNumber} was cancelled: ${data.reason || "No reason provided"}`,
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
    socket.on("courier:location", handleCourierLocation);

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
      socket.off("courier:location", handleCourierLocation);
    };
  }, [socket, authUser, queryClient]);

  useEffect(() => {
    if (!socket || authUser?.role !== "seller") return;

    const handleNewOrder = (data) => {
      console.log("🔔 New order received:", data);

      const audio = new Audio("/sounds/new-order.mp3");
      audio.play().catch((e) => console.log("Audio play failed:", e));

      toast.success("New Order!", {
        description: `Order #${data.order?.orderNumber} - $${data.order?.total?.toFixed(2) ?? "0.00"}`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("New Order! 🔔", {
          body: `Order #${data.order?.orderNumber} - $${data.order?.total?.toFixed(2) ?? "0.00"}`,
          icon: "/logos/chow-logo-filled.png",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    };

    const handleOrderCancelled = (data) => {
      console.log("❌ Order cancelled by customer:", data);

      toast.error("Order Cancelled", {
        description: `Order #${data.order?.orderNumber} was cancelled by customer`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("Order Cancelled ❌", {
          body: `Order #${data.order?.orderNumber} was cancelled by customer`,
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
  }, [socket, authUser, queryClient]);

  useEffect(() => {
    if (!socket || authUser?.role !== "courier") return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrders"] });
    };

    socket.on("order:assigned", invalidate);
    socket.on("order:picked_up", invalidate);
    socket.on("order:in_transit", invalidate);
    socket.on("order:delivered", invalidate);

    return () => {
      socket.off("order:assigned", invalidate);
      socket.off("order:picked_up", invalidate);
      socket.off("order:in_transit", invalidate);
      socket.off("order:delivered", invalidate);
    };
  }, [socket, authUser, queryClient]);

  return { isConnected };
};
