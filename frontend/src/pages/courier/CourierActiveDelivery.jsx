import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Spinner from "@/components/Spinner";
import { CourierActiveDeliveryMap } from "@/components/Courier/components/CourierActiveDeliveryMap";
import { CourierDeliveryPanel } from "@/components/Courier/components/CourierDeliveryPanel";
import useGetCourierOrderById from "@/hooks/Courier/useGetCourierOrderById";

const ACTIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

export default function CourierActiveDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, isLoading, isError } = useGetCourierOrderById(orderId);

  useEffect(() => {
    if (!order) return;
    if (!ACTIVE_STATUSES.includes(order.status)) {
      navigate("/courier/orders", { replace: true });
    }
  }, [order, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="font-medium text-muted-foreground ">Delivery not found</p>
        <Link
          to="/courier/orders"
          className="text-sm font-semibold text-primary hover:text-primary "
        >
          Back to deliveries
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <CourierActiveDeliveryMap order={order} />

        <Link
          to="/courier/orders"
          className="absolute left-4 top-4 z-1000 flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lg backdrop-blur-sm transition hover:bg-white "
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
