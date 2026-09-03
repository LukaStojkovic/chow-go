/**
 * Restaurant page header.
 *
 * Everything needed to decide whether to order sits above the menu: name,
 * cuisine, rating, delivery estimate, fee, distance, and - when it applies -
 * a plain-language notice that the kitchen is shut. The notice is a real
 * `role="status"` block rather than a greyed-out badge, because it changes
 * what the customer can do on the page.
 */

import { ChevronRight, Info, UtensilsCrossed } from "lucide-react";

import { unavailableReason } from "@/lib/adapters/restaurant";
import { SmartImage } from "@/components/common/SmartImage";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import {
  DeliveryEstimate,
  DeliveryFee,
  DistanceLabel,
  MetaDot,
  RatingDisplay,
} from "@/components/common/Meta";
import { AvailabilityBadge } from "@/components/common/StatusBadges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").RestaurantView} props.restaurant
 * @param {boolean} props.isFavourite
 * @param {() => void} props.onToggleFavourite
 * @param {boolean} props.isTogglingFavourite
 * @param {() => void} props.onShowInfo
 */
export function RestaurantHero({
  restaurant,
  isFavourite,
  onToggleFavourite,
  isTogglingFavourite,
  onShowInfo,
}) {
  const closedNotice = unavailableReason(restaurant);

  return (
    <header>
      <SmartImage
        src={restaurant.coverImage}
        alt=""
        ratio="hero"
        loading="eager"
        fallbackIcon={UtensilsCrossed}
        className="rounded-md"
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-display min-w-0">{restaurant.name}</h1>
            {restaurant.availability !== "open" && (
              <AvailabilityBadge availability={restaurant.availability} size="lg" />
            )}
          </div>
          <p className="text-body text-muted-foreground">{restaurant.cuisine}</p>
        </div>

        <FavoriteButton
          placement="header"
          isFavorite={isFavourite}
          isPending={isTogglingFavourite}
          restaurantName={restaurant.name}
          onToggle={onToggleFavourite}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <RatingDisplay
          rating={restaurant.rating}
          reviewCount={restaurant.reviewCount}
          size="md"
        />
        <MetaDot />
        <DeliveryEstimate estimate={restaurant.deliveryEstimate} />
        <MetaDot />
        <DeliveryFee fee={restaurant.deliveryFee} />
        {restaurant.distance != null && (
          <>
            <MetaDot />
            <DistanceLabel metres={restaurant.distance} />
          </>
        )}

        <Button variant="link" size="sm" className="ml-auto" onClick={onShowInfo}>
          <Info aria-hidden="true" />
          Hours &amp; info
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {closedNotice && (
        <p
          role="status"
          className="border-border bg-muted text-body-sm text-muted-foreground mt-4 rounded-md border p-3"
        >
          {closedNotice} You can still browse the menu - ordering will open again when
          the kitchen does.
        </p>
      )}

      {restaurant.description && (
        <p className="text-body text-muted-foreground mt-4 max-w-prose">
          {restaurant.description}
        </p>
      )}
    </header>
  );
}

/** Matches the hero's proportions so the header does not jump when data lands. */
export function RestaurantHeroSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[16/9] w-full rounded-md sm:aspect-[21/9]" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </div>
  );
}
