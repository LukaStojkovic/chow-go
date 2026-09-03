/**
 * Rate a delivered order.
 *
 * The star control is a real radio group: five inputs, arrow-key navigable,
 * each with a proper label ("3 stars"). The previous version used buttons with
 * hover state only, which meant a keyboard user could not tell what was
 * selected and a screen reader announced five unrelated buttons.
 *
 * Restaurant and courier are rated together in one submission because the
 * backend takes both in a single PATCH.
 */

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRateOrder } from "@/hooks/Orders/useRateOrder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/common/SmartImage";

/**
 * @param {Object} props
 * @param {string} props.name Radio group name - must be unique on the page.
 * @param {number} props.value
 * @param {(value: number) => void} [props.onChange]
 * @param {string} props.label
 * @param {boolean} [props.readOnly]
 */
function StarRating({ name, value, onChange, label, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      <legend className="sr-only">{label}</legend>

      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= shown;
        const inputId = `${name}-${star}`;

        return (
          <span key={star} className="relative">
            <input
              type="radio"
              id={inputId}
              name={name}
              value={star}
              checked={value === star}
              disabled={readOnly}
              onChange={() => onChange?.(star)}
              className="peer sr-only"
            />
            <label
              htmlFor={inputId}
              onMouseEnter={() => !readOnly && setHovered(star)}
              className={cn(
                "flex size-9 items-center justify-center rounded-sm",
                !readOnly && "cursor-pointer",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
              )}
            >
              <span className="sr-only">
                {star} {star === 1 ? "star" : "stars"}
              </span>
              <Star
                className={cn(
                  "size-6 transition-colors duration-(--duration-micro)",
                  isFilled ? "fill-rating text-rating" : "text-border-strong",
                )}
                aria-hidden="true"
              />
            </label>
          </span>
        );
      })}
    </fieldset>
  );
}

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").OrderView} props.order
 */
export function OrderRating({ order }) {
  const { rateOrder, isRating } = useRateOrder(order.id);

  const existing = order.rating;
  const hasRated = Boolean(existing?.ratedAt);

  const [restaurantRating, setRestaurantRating] = useState(existing?.restaurantRating ?? 0);
  const [courierRating, setCourierRating] = useState(existing?.courierRating ?? 0);
  const [restaurantReview, setRestaurantReview] = useState(existing?.restaurantReview ?? "");
  const [courierReview, setCourierReview] = useState(existing?.courierReview ?? "");

  const canSubmit = restaurantRating > 0 || courierRating > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    rateOrder({
      // Omit a rating that was never given rather than sending 0, which the
      // schema rejects (min: 1).
      ...(restaurantRating > 0 && { restaurantRating }),
      ...(courierRating > 0 && { courierRating }),
      ...(restaurantReview.trim() && { restaurantReview: restaurantReview.trim() }),
      ...(courierReview.trim() && { courierReview: courierReview.trim() }),
    });
  };

  return (
    <Card padded className="space-y-5">
      <div>
        <h2 className="text-h2">{hasRated ? "Your review" : "How did it go?"}</h2>
        <p className="text-body-sm text-muted-foreground mt-0.5">
          {hasRated
            ? "Thanks - this helps other people choose."
            : "Your rating helps the restaurant and the courier, and helps others decide."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              src={order.restaurant?.logo}
              name={order.restaurant?.name || "Restaurant"}
            />
            <span className="text-label min-w-0 flex-1 truncate">
              {order.restaurant?.name || "The restaurant"}
            </span>
            <StarRating
              name="restaurant-rating"
              value={restaurantRating}
              onChange={setRestaurantRating}
              readOnly={hasRated}
              label={`Rate ${order.restaurant?.name || "the restaurant"}`}
            />
          </div>

          {!hasRated && restaurantRating > 0 && (
            <>
              <Label htmlFor="restaurant-review" className="sr-only">
                Tell us about the food
              </Label>
              <Textarea
                id="restaurant-review"
                rows={2}
                maxLength={500}
                value={restaurantReview}
                onChange={(event) => setRestaurantReview(event.target.value)}
                placeholder="How was the food? (optional)"
              />
            </>
          )}

          {hasRated && existing?.restaurantReview && (
            <p className="text-body-sm text-muted-foreground bg-muted rounded-sm p-3">
              {existing.restaurantReview}
            </p>
          )}
        </div>

        {order.courier && (
          <div className="border-border space-y-2 border-t pt-4">
            <div className="flex items-center gap-3">
              <Avatar size="sm" src={order.courier.avatar} name={order.courier.name} />
              <span className="text-label min-w-0 flex-1 truncate">
                {order.courier.name}
              </span>
              <StarRating
                name="courier-rating"
                value={courierRating}
                onChange={setCourierRating}
                readOnly={hasRated}
                label={`Rate ${order.courier.name}`}
              />
            </div>

            {!hasRated && courierRating > 0 && (
              <>
                <Label htmlFor="courier-review" className="sr-only">
                  Tell us about the delivery
                </Label>
                <Textarea
                  id="courier-review"
                  rows={2}
                  maxLength={500}
                  value={courierReview}
                  onChange={(event) => setCourierReview(event.target.value)}
                  placeholder="How was the delivery? (optional)"
                />
              </>
            )}

            {hasRated && existing?.courierReview && (
              <p className="text-body-sm text-muted-foreground bg-muted rounded-sm p-3">
                {existing.courierReview}
              </p>
            )}
          </div>
        )}

        {!hasRated && (
          <Button
            type="submit"
            block
            disabled={!canSubmit}
            isLoading={isRating}
            loadingLabel="Submitting your review"
          >
            Submit review
          </Button>
        )}
      </form>
    </Card>
  );
}
