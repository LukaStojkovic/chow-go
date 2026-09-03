/**
 * Restaurant card.
 *
 * Built for rapid comparison: name, cuisine, rating, delivery estimate, fee,
 * distance and availability all sit in fixed positions, so scanning a grid is
 * a vertical read rather than a hunt.
 *
 * The whole card is clickable without nesting a button inside a link. The
 * heading holds the only anchor, and its `::after` stretches over the card;
 * the favourite button is raised above that overlay. This is the pattern that
 * keeps one link per card in the accessibility tree while still giving a
 * pointer the large target it expects.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { hoverLift, listItem } from "@/lib/motion";
import { SmartImage } from "@/components/common/SmartImage";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { AvailabilityBadge } from "@/components/common/StatusBadges";
import {
  DeliveryEstimate,
  DeliveryFee,
  DistanceLabel,
  MetaDot,
  RatingDisplay,
} from "@/components/common/Meta";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").RestaurantView} props.restaurant
 * @param {boolean} [props.isFavourite]
 * @param {(id: string) => void} [props.onToggleFavourite]
 * @param {boolean} [props.isTogglingFavourite]
 * @param {"default"|"compact"} [props.variant] `compact` is the rail card:
 *   fixed width, fewer metadata lines.
 * @param {boolean} [props.animate] Off inside virtualised or paginated lists
 *   where re-entry animation would replay on every page.
 * @param {string} [props.className] Lets a rail that becomes a grid at a
 *   breakpoint drop the fixed width, instead of rendering the card twice.
 */
export function RestaurantCard({
  restaurant,
  isFavourite = false,
  onToggleFavourite,
  isTogglingFavourite = false,
  variant = "default",
  animate = true,
  className,
}) {
  const isClosed = restaurant.availability !== "open";
  const Wrapper = animate ? motion.article : "article";
  // The lift is a spring on transform; the shadow and border ride the CSS
  // transition in `.surface-interactive`. Split that way because a springing
  // box-shadow repaints every frame and a springing colour looks wrong.
  const motionProps = animate ? { variants: listItem, ...hoverLift } : {};

  return (
    <Wrapper
      {...motionProps}
      className={cn(
        "group bg-card border-border relative flex flex-col overflow-hidden rounded-md border",
        "shadow-subtle surface-interactive",
        "hover:border-border-strong hover:shadow-raised",
        "focus-within:border-ring focus-within:shadow-raised",
        variant === "compact" && "w-64 shrink-0 snap-start",
        className,
      )}
    >
      <div className="relative">
        <SmartImage
          src={restaurant.coverImage}
          alt=""
          ratio="card"
          fallbackIcon={UtensilsCrossed}
          imgClassName={cn(
            "image-zoom",
            // A closed restaurant is still browsable, but the photo stops
            // selling it.
            isClosed && "opacity-55 saturate-50",
          )}
        />

        {isClosed && (
          <div className="absolute inset-x-3 bottom-3">
            <AvailabilityBadge availability={restaurant.availability} placement="onCard" />
          </div>
        )}

        {onToggleFavourite && (
          <div className="absolute top-2 right-2 z-20">
            <FavoriteButton
              isFavorite={isFavourite}
              isPending={isTogglingFavourite}
              restaurantName={restaurant.name}
              onToggle={() => onToggleFavourite(restaurant.id)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-h3 text-foreground min-w-0 flex-1">
            <Link
              to={`/restaurant/${restaurant.id}`}
              className={cn(
                "line-clamp-2 outline-none",
                // Stretches the anchor's hit area over the whole card while
                // leaving the favourite button (z-20) clickable.
                "after:absolute after:inset-0 after:z-10 after:content-['']",
                "focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-2",
              )}
            >
              {restaurant.name}
            </Link>
          </h3>
          <RatingDisplay
            rating={restaurant.rating}
            reviewCount={restaurant.reviewCount}
            showCount={variant === "default"}
            className="mt-0.5 shrink-0"
          />
        </div>

        <p className="text-body-sm text-muted-foreground truncate">{restaurant.cuisine}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <DeliveryEstimate estimate={restaurant.deliveryEstimate} />
          <MetaDot />
          <DeliveryFee fee={restaurant.deliveryFee} />
          {/* Distance is one of the signals people compare on, so it is shown
              wherever the API provides it. The row wraps rather than truncates
              on a narrow card. */}
          {restaurant.distance != null && (
            <>
              <MetaDot />
              <DistanceLabel metres={restaurant.distance} />
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

/**
 * Loading placeholder. Matches the real card's proportions exactly - image
 * block, two text lines, one metadata row - so nothing shifts when data lands.
 */
export function RestaurantCardSkeleton({ variant = "default", className }) {
  return (
    <div
      className={cn(
        "bg-card border-border overflow-hidden rounded-md border",
        variant === "compact" && "w-64 shrink-0",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
