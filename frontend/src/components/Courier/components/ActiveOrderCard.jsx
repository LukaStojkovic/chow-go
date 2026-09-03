import Spinner from "@/components/Spinner";
import useMarkAsDeliveredOrder from "@/hooks/Courier/useMarkAsDeliveredOrder";
import useMarkAsPickedUpOrder from "@/hooks/Courier/useMarkAsPickedUpOrder";
import { CheckCircle, MapPin, Navigation } from "lucide-react";
import useMarkAsInTransitOrder from "@/hooks/Courier/useMarkAsInTransitOrder";

const STATUS_CONFIG = {
  assigned: {
    label: "Heading to restaurant",
    color: "text-warning ",
    bg: "bg-warning-subtle ",
    nextAction: "Picked Up",
    nextIcon: CheckCircle,
  },
  picked_up: {
    label: "Order picked up",
    color: "text-primary ",
    bg: "bg-primary-subtle ",
    nextAction: "Start Delivery",
    nextIcon: Navigation,
  },
  in_transit: {
    label: "On the way",
    color: "text-primary ",
    bg: "bg-primary-subtle ",
    nextAction: "Mark Delivered",
    nextIcon: CheckCircle,
  },
};

export function ActiveOrderCard({ order }) {
  const { markPickedUpOrder, isMarkingPickedUp } = useMarkAsPickedUpOrder();
  const { markInTransitOrder, isMarkingInTransit } = useMarkAsInTransitOrder();
  const { markDeliveredOrder, isMarkingDelivered } = useMarkAsDeliveredOrder();

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.assigned;
  const action = {
    assigned: { fn: markPickedUpOrder, isPending: isMarkingPickedUp },
    picked_up: { fn: markInTransitOrder, isPending: isMarkingInTransit },
    in_transit: { fn: markDeliveredOrder, isPending: isMarkingDelivered },
  }[order.status] ?? { fn: () => {}, isPending: false };
  const NextIcon = config.nextIcon;

  const restaurantAddress = order.restaurant?.address
    ? `${order.restaurant.address.street}, ${order.restaurant.address.city}`
    : "Address unavailable";

  const deliveryAddress =
    order.deliveryAddressSnapshot?.fullAddress ?? "Address unavailable";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card ">
      <div className={`px-5 py-3 ${config.bg}`}>
        <span className={`text-sm font-bold uppercase ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground ">
              {order.restaurant?.name ?? "Restaurant"}
            </p>
            <p className="text-sm text-muted-foreground ">
              #
              {order.orderNumber?.split("-").pop() ??
                order.orderNumber ??
                "N/A"}
            </p>{" "}
          </div>
          <span className="text-lg font-bold text-primary ">
            {order.total != null ? `${order.total.toFixed(2)}` : "—"}
          </span>{" "}
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-card " />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground ">
                {restaurantAddress}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground ">
                {deliveryAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted py-3 font-semibold text-foreground transition hover:bg-secondary ">
            <Navigation className="h-5 w-5" />
            Navigate
          </button>
          <button
            onClick={() => action.fn(order._id)}
            disabled={action.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg  transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {action.isPending ? (
              <Spinner />
            ) : (
              <>
                <NextIcon className="h-5 w-5" />
                {config.nextAction}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
