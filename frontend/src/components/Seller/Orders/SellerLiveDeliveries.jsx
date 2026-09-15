import { Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bike, MapPin, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { lazyNamed } from "@/lib/lazyNamed";

const NavigationMap = lazyNamed(
  () => import("@/components/Map/NavigationMap"),
  "NavigationMap",
);
import { useOrderCourierLocation } from "@/hooks/Map/useOrderCourierLocation";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { formatDistance, formatDuration, toLatLng } from "@chowgo/shared/geo";

const LIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

// Keys, not copy: module scope runs before a language is picked.
const STATUS_LABEL = {
  assigned: "seller:orders.courierHeadingToYou",
  picked_up: "order:short.picked_up",
  in_transit: "seller:orders.outForDelivery",
};

export function SellerLiveDeliveries({ orders, restaurantCoordinates }) {
  const { t } = useTranslation(["seller", "order", "courier", "common"]);
  const liveOrders = useMemo(
    () =>
      (orders ?? []).filter(
        (order) => order.courier && LIVE_STATUSES.includes(order.status),
      ),
    [orders],
  );

  const [selectedId, setSelectedId] = useState(null);

  const selected =
    liveOrders.find((order) => order._id === selectedId) ?? liveOrders[0];

  if (!selected) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <h2 className="font-bold">
              {t("orders.liveDeliveries", { count: liveOrders.length })}
            </h2>
          </div>

          {liveOrders.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {liveOrders.map((order) => (
                <button
                  key={order._id}
                  type="button"
                  onClick={() => setSelectedId(order._id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    order._id === selected._id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  #{order.orderNumber?.split("-").pop() ?? "—"}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <SellerDeliveryMap
          key={selected._id}
          order={selected}
          restaurantCoordinates={restaurantCoordinates}
        />
      </CardContent>
    </Card>
  );
}

function SellerDeliveryMap({ order, restaurantCoordinates }) {
  const { t } = useTranslation(["seller", "order", "courier", "common"]);
  const restaurantCoords = toLatLng(restaurantCoordinates);
  const deliveryCoords = toLatLng(
    order.deliveryAddressSnapshot?.location?.coordinates,
  );

  const { coords: courierCoords, isStale } = useOrderCourierLocation(
    order._id,
    order.courier,
  );

  const headingToRestaurant = order.status === "assigned";
  const routeFrom =
    courierCoords ?? (headingToRestaurant ? null : restaurantCoords);
  const routeTo = headingToRestaurant ? restaurantCoords : deliveryCoords;

  const { route } = useRouteDirections(
    routeFrom,
    routeTo,
    Boolean(routeFrom && routeTo),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">
          {STATUS_LABEL[order.status] ? t(STATUS_LABEL[order.status]) : order.status}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Bike className="h-3.5 w-3.5" />
          {order.courier?.fullName ?? "Courier"}
          {order.courier?.phoneNumber ? ` · ${order.courier.phoneNumber}` : ""}
        </span>
        {route && (
          <span className="text-muted-foreground">
            {formatDistance(route.distance)} ·{" "}
            {formatDuration(route.duration)}{" "}
            {headingToRestaurant ? "to pickup" : "to customer"}
          </span>
        )}
        {isStale && (
          <span className="text-muted-foreground">
            {t("courier:orders.courierStalled")}
          </span>
        )}
      </div>

      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-border sm:h-72">
        <Suspense
          fallback={<div className="absolute inset-0 animate-pulse bg-muted" />}
        >
          <NavigationMap
            restaurantCoords={restaurantCoords}
            deliveryCoords={deliveryCoords}
            courierCoords={courierCoords}
            routeCoords={route?.coordinates}
            followCourier={false}
            className="absolute inset-0"
          />
        </Suspense>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {restaurantCoords && (
          <span className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
            {t("settings.yourRestaurant")}
          </span>
        )}
        {deliveryCoords && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-destructive" />
            {order.deliveryAddressSnapshot?.fullAddress ?? "Drop-off"}
          </span>
        )}
      </div>
    </div>
  );
}
