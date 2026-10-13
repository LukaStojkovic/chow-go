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
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRateOrder } from "@/hooks/Orders/useRateOrder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/common/SmartImage";
import { TagChip } from "@/components/reviews/ReviewParts";
import { useTagLabel } from "@/hooks/Reviews/useTagLabel";
import { REVIEW_LIMITS, tagsForRating } from "@chowgo/shared/reviews";

/**
 * @param {Object} props
 * @param {string} props.name Radio group name - must be unique on the page.
 * @param {number} props.value
 * @param {(value: number) => void} [props.onChange]
 * @param {string} props.label
 * @param {boolean} [props.readOnly]
 */
function StarRating({ name, value, onChange, label, readOnly = false }) {
  const { t } = useTranslation("common");
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
                {t("common:count.stars", { count: star })}
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

function TagPicker({ kind, rating, value, onChange, readOnly = false }) {
  const { t } = useTranslation("restaurant");
  const tagLabel = useTagLabel();

  if (readOnly) {
    if (!value?.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <TagChip key={tag}>{tagLabel(tag)}</TagChip>
        ))}
      </div>
    );
  }

  const offered = tagsForRating(kind, rating);
  if (offered.length === 0) return null;
  const isFull = value.length >= REVIEW_LIMITS.maxTags;
  const promptId = `${kind}-tags-prompt`;

  const toggle = (tag) =>
    onChange(value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag]);

  return (
    <div className="space-y-2" role="group" aria-labelledby={promptId}>
      <p id={promptId} className="text-body-sm text-muted-foreground">
        {t("restaurant:reviews.tagsPrompt")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {offered.map((tag) => {
          const isActive = value.includes(tag);
          return (
            <TagChip
              key={tag}
              isActive={isActive}
              disabled={!isActive && isFull}
              onClick={() => toggle(tag)}
            >
              {tagLabel(tag)}
            </TagChip>
          );
        })}
      </div>
    </div>
  );
}

function keepOffered(kind, rating, tags) {
  const offered = tagsForRating(kind, rating);
  return tags.filter((tag) => offered.includes(tag));
}

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").OrderView} props.order
 */
export function OrderRating({ order }) {
  const { t } = useTranslation(["order", "common"]);
  const { rateOrder, isRating } = useRateOrder(order.id);

  const existing = order.rating;
  const hasRated = Boolean(existing?.ratedAt);

  const [restaurantRating, setRestaurantRating] = useState(existing?.restaurantRating ?? 0);
  const [courierRating, setCourierRating] = useState(existing?.courierRating ?? 0);
  const [restaurantReview, setRestaurantReview] = useState(existing?.restaurantReview ?? "");
  const [courierReview, setCourierReview] = useState(existing?.courierReview ?? "");
  const [restaurantTags, setRestaurantTags] = useState([]);
  const [courierTags, setCourierTags] = useState([]);

  const changeRestaurantRating = (stars) => {
    setRestaurantRating(stars);
    setRestaurantTags((tags) => keepOffered("restaurant", stars, tags));
  };
  const changeCourierRating = (stars) => {
    setCourierRating(stars);
    setCourierTags((tags) => keepOffered("courier", stars, tags));
  };

  const canSubmit = restaurantRating > 0 || courierRating > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    rateOrder({
      // Omit a rating that was never given rather than sending 0, which the
      // schema rejects (min: 1).
      ...(restaurantRating > 0 && { restaurantRating, restaurantTags }),
      ...(courierRating > 0 && { courierRating, courierTags }),
      ...(restaurantReview.trim() && { restaurantReview: restaurantReview.trim() }),
      ...(courierReview.trim() && { courierReview: courierReview.trim() }),
    });
  };

  return (
    <Card padded className="space-y-5">
      <div>
        <h2 className="text-h2">
          {hasRated ? t("rating.yourReview") : t("rating.howDidItGo")}
        </h2>
        <p className="text-body-sm text-muted-foreground mt-0.5">
          {hasRated ? t("rating.thanksHelps") : t("rating.helpsOthers")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              src={order.restaurant?.logo}
              name={order.restaurant?.name || t("common:fallback.restaurant")}
            />
            <span className="text-label min-w-0 flex-1 truncate">
              {order.restaurant?.name || t("rating.restaurantHeading")}
            </span>
            <StarRating
              name="restaurant-rating"
              value={restaurantRating}
              onChange={changeRestaurantRating}
              readOnly={hasRated}
              label={t("order:rating.rateName", {
                name: order.restaurant?.name || t("common:fallback.restaurant"),
              })}
            />
          </div>

          <TagPicker
            kind="restaurant"
            rating={restaurantRating}
            value={hasRated ? (existing?.restaurantTags ?? []) : restaurantTags}
            onChange={setRestaurantTags}
            readOnly={hasRated}
          />

          {!hasRated && restaurantRating > 0 && (
            <>
              <Label htmlFor="restaurant-review" className="sr-only">
                {t("rating.restaurantHeading")}
              </Label>
              <Textarea
                id="restaurant-review"
                rows={2}
                maxLength={500}
                value={restaurantReview}
                onChange={(event) => setRestaurantReview(event.target.value)}
                placeholder={t("rating.foodPlaceholder")}
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
                onChange={changeCourierRating}
                readOnly={hasRated}
                label={`Rate ${order.courier.name}`}
              />
            </div>

            <TagPicker
              kind="courier"
              rating={courierRating}
              value={hasRated ? (existing?.courierTags ?? []) : courierTags}
              onChange={setCourierTags}
              readOnly={hasRated}
            />

            {!hasRated && courierRating > 0 && (
              <>
                <Label htmlFor="courier-review" className="sr-only">
                  {t("rating.courierHeading")}
                </Label>
                <Textarea
                  id="courier-review"
                  rows={2}
                  maxLength={500}
                  value={courierReview}
                  onChange={(event) => setCourierReview(event.target.value)}
                  placeholder={t("rating.deliveryPlaceholder")}
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
            loadingLabel={t("rating.submitting")}
          >
            {t("rating.submit")}
          </Button>
        )}
      </form>
    </Card>
  );
}
