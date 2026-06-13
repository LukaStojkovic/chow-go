import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import { CourierActiveDeliveryMap } from "@/components/Courier/components/CourierActiveDeliveryMap";
import { CourierDeliveryPanel } from "@/components/Courier/components/CourierDeliveryPanel";
import useGetCourierOrderById from "@/hooks/Courier/useGetCourierOrderById";
import { useSocket } from "@/contexts/SocketContext";

const ACTIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

export default function CourierActiveDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { order, isLoading, isError } = useGetCourierOrderById(orderId);

  useEffect(() => {
    if (!socket || !orderId) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["courierOrder", orderId] });
    };

    socket.on("order:picked_up", invalidate);
    socket.on("order:in_transit", invalidate);
    socket.on("order:delivered", invalidate);

    return () => {
      socket.off("order:picked_up", invalidate);
      socket.off("order:in_transit", invalidate);
      socket.off("order:delivered", invalidate);
    };
  }, [socket, orderId, queryClient]);

  useEffect(() => {
    if (!order) return;
    if (!ACTIVE_STATUSES.includes(order.status)) {
      navigate("/courier/orders", { replace: true });
    }
  }, [order, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-medium text-gray-500 dark:text-gray-400">
          Delivery not found
        </p>
        <Link
          to="/courier/orders"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Back to deliveries
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <CourierActiveDeliveryMap order={order} />

        <Link
          to="/courier/orders"
          className="absolute left-4 top-4 z-1000 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg backdrop-blur-sm transition hover:bg-white dark:bg-zinc-900/95 dark:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative z-10 shrink-0">
        <CourierDeliveryPanel
          order={order}
          onDelivered={() => navigate("/courier/orders", { replace: true })}
        />
      </div>
    </div>
  );
}
