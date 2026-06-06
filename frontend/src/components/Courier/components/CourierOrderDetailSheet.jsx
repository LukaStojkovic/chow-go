import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Spinner from "@/components/Spinner";
import { CourierOrderMap } from "./CourierOrderMap";
import { CourierOrderRoute } from "./CourierOrderRoute";
import { CourierOrderEarnings } from "./CourierOrderEarningsCard";
import { CourierOrderItems } from "./CourierOrderItemsCard";
import { CourierOrderNotes } from "./CourierOrderNoteCard";
import { CourierOrderPayment } from "./CourierOrderPaymentCard";

function toLatLng(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  return [coordinates[1], coordinates[0]];
}

export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

export function CourierOrderDetailSheet({
  order,
  onClose,
  onAccept,
  isAccepting,
}) {
  const restaurantCoords = toLatLng(order.restaurant?.location?.coordinates);
  const deliveryCoords = toLatLng(
    order.deliveryAddressSnapshot?.location?.coordinates,
  );
  const hasMap = restaurantCoords && deliveryCoords;

  const distanceKm = order.deliveryDistance
    ? (order.deliveryDistance / 1000).toFixed(1)
    : null;

  const earnings = (order.deliveryFee ?? 0) + (order.tip ?? 0);
  const shortNum = order.orderNumber?.split("-")[2] ?? order.orderNumber;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />

        <DialogPrimitive.Content
          onEscapeKeyDown={onClose}
          onInteractOutside={onClose}
          className="
    fixed z-50 mx-auto w-full max-w-lg
    flex flex-col
    bg-background border border-border shadow-2xl
    overflow-hidden focus:outline-none

    bottom-0 inset-x-0 rounded-t-2xl rounded-b-none max-h-[90dvh]

    sm:inset-x-auto sm:bottom-auto
    sm:left-1/2 sm:top-1/2
    sm:-translate-x-1/2 sm:-translate-y-1/2
    sm:rounded-2xl sm:max-h-[85vh]
  "
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-9 rounded-full bg-muted" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold">
                Order #{shortNum}
              </DialogTitle>
              {distanceKm && (
                <Badge variant="secondary" className="text-xs font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  {distanceKm} km
                </Badge>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {hasMap && (
              <CourierOrderMap
                restaurantCoords={restaurantCoords}
                deliveryCoords={deliveryCoords}
                distanceKm={distanceKm}
                deliveryDistance={order.deliveryDistance}
              />
            )}

            <div className="divide-y divide-border">
              <CourierOrderRoute
                restaurant={order.restaurant}
                deliveryAddressSnapshot={order.deliveryAddressSnapshot}
              />
              <CourierOrderEarnings
                deliveryFee={order.deliveryFee}
                tip={order.tip}
              />
              <CourierOrderItems items={order.items} total={order.total} />
              <CourierOrderNotes
                customerNotes={order.customerNotes}
                addressNotes={order.deliveryAddressSnapshot?.notes}
              />
              <CourierOrderPayment paymentMethod={order.paymentMethod} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-background px-5 py-4">
            <Button
              onClick={() => {
                onAccept(order._id);
                onClose();
              }}
              disabled={isAccepting}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
            >
              {isAccepting ? (
                <Spinner />
              ) : (
                <>
                  Accept delivery
                  <Badge className="bg-emerald-500/40 hover:bg-emerald-500/40 text-white border-0 font-medium">
                    +${earnings.toFixed(2)}
                  </Badge>
                </>
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
