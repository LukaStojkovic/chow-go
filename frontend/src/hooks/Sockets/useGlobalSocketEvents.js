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
    }
  }, [isConnected, authUser, register]);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket || authUser?.role !== "customer") return;

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

    return () => {
      socket.off("order:confirmed", handleOrderConfirmed);
      socket.off("order:rejected", handleOrderRejected);
      socket.off("order:preparing", handleOrderPreparing);
      socket.off("order:ready", handleOrderReady);
      socket.off("order:cancelled", handleOrderCancelled);
    };
  }, [socket, authUser, queryClient]);

  useEffect(() => {
    if (!socket || authUser?.role !== "seller") return;

    const handleNewOrder = (data) => {
      console.log("🔔 New order received:", data);

      const audio = new Audio("/sounds/new-order.mp3");
      audio.play().catch((e) => console.log("Audio play failed:", e));

      toast.success("New Order!", {
        description: `Order #${data.order?.orderNumber} - $${data.order?.total.toFixed(2)}`,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        new Notification("New Order! 🔔", {
          body: `Order #${data.order?.orderNumber} - $${data.order?.total.toFixed(2)}`,
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

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:cancelled", handleOrderCancelled);
    };
  }, [socket, authUser, queryClient]);

  return { isConnected };
};
