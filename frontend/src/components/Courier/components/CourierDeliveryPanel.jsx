import Spinner from "@/components/Spinner";
import { useTranslation } from "react-i18next";
import useMarkAsDeliveredOrder from "@/hooks/Courier/useMarkAsDeliveredOrder";
import useMarkAsPickedUpOrder from "@/hooks/Courier/useMarkAsPickedUpOrder";
import useMarkAsInTransitOrder from "@/hooks/Courier/useMarkAsInTransitOrder";
import { CheckCircle, MapPin, Navigation, Phone } from "lucide-react";

// Keys rather than copy: this table is built at module scope, before a
// language exists, and a resolved string would freeze in whichever one loaded
// first.
const STATUS_CONFIG = {
  assigned: {
    labelKey: "delivery.headingToRestaurant",
    color: "text-warning ",
    bg: "bg-warning-subtle ",
    nextActionKey: "delivery.markPickedUp",
    nextIcon: CheckCircle,
  },
  picked_up: {
    labelKey: "delivery.pickedUp",
    color: "text-primary ",
    bg: "bg-primary-subtle ",
    nextActionKey: "delivery.markInTransit",
    nextIcon: Navigation,
  },
  in_transit: {
    labelKey: "delivery.onTheWayToCustomer",
    color: "text-primary ",
    bg: "bg-primary-subtle ",
    nextActionKey: "delivery.markDelivered",
    nextIcon: CheckCircle,
  },
};

export function CourierDeliveryPanel({ order, onDelivered }) {
  const { t } = useTranslation(["courier", "common"]);
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
    : t("delivery.addressUnavailable");

  const deliveryAddress =
    order.deliveryAddressSnapshot?.fullAddress ?? t("delivery.addressUnavailable");

  const shortNum =
    order.orderNumber?.split("-").pop() ?? order.orderNumber ?? "N/A";

  return (
    <div className="rounded-t-3xl border-t border-border bg-card shadow-2xl ">
      <div className={`px-5 py-3 ${config.bg}`}>
        <span
          className={`text-xs font-bold uppercase tracking-wide ${config.color}`}
        >
          {t(config.labelKey)}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-foreground ">
              {order.restaurant?.name ?? "Restaurant"}
            </p>
            <p className="text-sm text-muted-foreground ">
              {t("order:detail.numbered", { number: shortNum })}
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
            {t("delivery.callCustomer")}
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
              {t(config.nextActionKey)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
