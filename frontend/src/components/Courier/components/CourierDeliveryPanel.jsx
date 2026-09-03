import Spinner from "@/components/Spinner";
import useMarkAsDeliveredOrder from "@/hooks/Courier/useMarkAsDeliveredOrder";
import useMarkAsPickedUpOrder from "@/hooks/Courier/useMarkAsPickedUpOrder";
import useMarkAsInTransitOrder from "@/hooks/Courier/useMarkAsInTransitOrder";
import { CheckCircle, MapPin, Navigation, Phone } from "lucide-react";

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
    label: "On the way to customer",
    color: "text-primary ",
    bg: "bg-primary-subtle ",
    nextAction: "Mark Delivered",
    nextIcon: CheckCircle,
  },
};

export function CourierDeliveryPanel({ order, onDelivered }) {
  const { markPickedUpOrder, isMarkingPickedUp } = useMarkAsPickedUpOrder();
  const { markInTransitOrder, isMarkingInTransit } = useMarkAsInTransitOrder();
  const { markDeliveredOrder, isMarkingDelivered } = useMarkAsDeliveredOrder();

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.assigned;
  const action = {
    assigned: { fn: markPickedUpOrder, isPending: isMarkingPickedUp },
    picked_up: { fn: markInTransitOrder, isPending: isMarkingInTransit },
    in_transit: {
      fn: (id) =>
        markDeliveredOrder(id, { onSuccess: () => onDelivered?.() }),
      isPending: isMarkingDelivered,
    },
  }[order.status] ?? { fn: () => {}, isPending: false };
  const NextIcon = config.nextIcon;

  const restaurantAddress = order.restaurant?.address
    ? `${order.restaurant.address.street}, ${order.restaurant.address.city}`
    : "Address unavailable";

  const deliveryAddress =
    order.deliveryAddressSnapshot?.fullAddress ?? "Address unavailable";

  const shortNum =
    order.orderNumber?.split("-").pop() ?? order.orderNumber ?? "N/A";

  return (
    <div className="rounded-t-3xl border-t border-border bg-card shadow-2xl ">
      <div className={`px-5 py-3 ${config.bg}`}>
        <span
          className={`text-xs font-bold uppercase tracking-wide ${config.color}`}
        >
          {config.label}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-foreground ">
              {order.restaurant?.name ?? "Restaurant"}
            </p>
            <p className="text-sm text-muted-foreground ">
              Order #{shortNum}
            </p>
          </div>
          <span className="shrink-0 text-lg font-bold text-primary ">
            ${order.total?.toFixed(2) ?? "—"}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary" />
            <p className="truncate text-sm text-muted-foreground ">
              {restaurantAddress}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="truncate text-sm text-muted-foreground ">
              {deliveryAddress}
            </p>
          </div>
        </div>

        {order.customer?.phoneNumber && (
          <a
            href={`tel:${order.customer.phoneNumber}`}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary "
          >
            <Phone className="h-4 w-4" />
            Call customer
          </a>
        )}

        <button
          type="button"
          onClick={() => action.fn(order._id)}
          disabled={action.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg  transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
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
  );
}
