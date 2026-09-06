/**
 * Hours, address and contact details.
 *
 * Opening hours are the thing customers actually come here for, so today is
 * marked and the week is shown in full rather than collapsed behind "see more".
 * The two schedule conventions the backend supports are spelled out in words:
 * equal open and close times mean around the clock, and a close time earlier
 * than the open time runs past midnight.
 */

import { Clock, MapPin, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { ResponsiveSheet } from "@/components/basket/ResponsiveSheet";
import { AvailabilityBadge } from "@/components/common/StatusBadges";
import { formatFee } from "@chowgo/shared/format";

/**
 * @param {import("@chowgo/shared/adapters/types").DayScheduleView} day
 * @returns {string}
 */
function describeHours(day) {
  if (!day.isOpen) return "Closed";
  if (day.opens === day.closes) return "Open 24 hours";
  if (day.closes < day.opens) return `${day.opens} - ${day.closes} (next day)`;
  return `${day.opens} - ${day.closes}`;
}

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import("@chowgo/shared/adapters/types").RestaurantView} props.restaurant
 */
export function RestaurantInfoSheet({ open, onClose, restaurant }) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={`${restaurant.name} - hours and information`}
      description="Opening hours, address and delivery details."
    >
      <div className="space-y-6 p-4 sm:p-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h3 flex items-center gap-2">
              <Clock className="text-muted-foreground size-4" aria-hidden="true" />
              Opening hours
            </h3>
            <AvailabilityBadge availability={restaurant.availability} />
          </div>

          {restaurant.schedule ? (
            <dl className="divide-border border-border divide-y rounded-md border">
              {restaurant.schedule.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    "flex items-center justify-between gap-4 px-3 py-2",
                    day.isToday && "bg-muted",
                  )}
                >
                  <dt
                    className={cn(
                      "text-body-sm",
                      day.isToday ? "text-foreground font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {day.label}
                    {day.isToday && <span className="text-muted-foreground font-normal"> (today)</span>}
                  </dt>
                  <dd
                    className={cn(
                      "text-body-sm tabular",
                      day.isOpen ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {describeHours(day)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-body-sm text-muted-foreground">
              This restaurant has not published its opening hours.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-h3">Delivery</h3>
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-body-sm text-muted-foreground">Estimated time</dt>
              <dd className="text-body-sm text-foreground tabular">
                {restaurant.deliveryEstimate}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-body-sm text-muted-foreground">Delivery fee</dt>
              <dd className="text-body-sm text-foreground tabular">
                {formatFee(restaurant.deliveryFee)}
              </dd>
            </div>
            {/* Minimum order is not modelled on the backend and nothing
                enforces one, so no line is shown rather than a fabricated 0. */}
          </dl>
        </section>

        {restaurant.address && (
          <section className="space-y-2">
            <h3 className="text-h3 flex items-center gap-2">
              <MapPin className="text-muted-foreground size-4" aria-hidden="true" />
              Address
            </h3>
            <address className="text-body-sm text-muted-foreground not-italic">
              {restaurant.address.oneLine}
            </address>
          </section>
        )}

        {restaurant.phone && (
          <section className="space-y-2">
            <h3 className="text-h3 flex items-center gap-2">
              <Phone className="text-muted-foreground size-4" aria-hidden="true" />
              Contact
            </h3>
            <a
              href={`tel:${restaurant.phone}`}
              className="text-body-sm text-primary hover:underline"
            >
              {restaurant.phone}
            </a>
          </section>
        )}
      </div>
    </ResponsiveSheet>
  );
}
