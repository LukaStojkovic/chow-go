import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionLabel } from "./CourierOrderDetailSheet";

export function CourierOrderRoute({ restaurant, deliveryAddressSnapshot }) {
  const { t } = useTranslation(["courier", "common"]);
  const restaurantAddress = restaurant?.address
    ? `${restaurant.address.street}, ${restaurant.address.city}`
    : t("delivery.addressUnavailable");

  const snap = deliveryAddressSnapshot ?? {};
  const deliveryAddress = snap.fullAddress ?? t("delivery.addressUnavailable");
  const deliveryDetails = [
    snap.floor && `Floor ${snap.floor}`,
    snap.entrance && `Entrance ${snap.entrance}`,
    snap.doorCode && `Code: ${snap.doorCode}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="px-5 py-4">
      <SectionLabel>{t("delivery.route")}</SectionLabel>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background" />
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {restaurant?.name ?? "Restaurant"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {restaurantAddress}
            </p>
          </div>
        </div>

        <div className="ml-1.5 h-5 w-px bg-border" />

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{t("delivery.dropoff")}</p>
            <p className="text-sm text-muted-foreground truncate">
              {deliveryAddress}
            </p>
            {deliveryDetails && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {deliveryDetails}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
