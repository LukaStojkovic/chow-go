/**
 * A dish, shown outside its restaurant's menu.
 *
 * Used on the discovery feed and in search results, where the important extra
 * information is which restaurant it comes from. Inside a restaurant menu the
 * denser `MenuItemRow` is used instead - a grid of photo cards makes a 60-item
 * menu unscannable.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { hoverLift, listItem } from "@/lib/motion";
import { SmartImage } from "@/components/common/SmartImage";
import { PromoPrice } from "@/components/common/Meta";
import { PromoBadge, SoldOutBadge } from "@/components/common/StatusBadges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").DishView} props.dish
 * @param {(dish: import("@/lib/adapters/types").DishView) => void} [props.onAdd]
 *   Opens the customisation sheet. Omit to make the card navigation-only.
 * @param {"default"|"compact"} [props.variant]
 * @param {boolean} [props.animate]
 */
export function DishCard({ dish, onAdd, variant = "default", animate = true }) {
  const Wrapper = animate ? motion.article : "article";
  const motionProps = animate ? { variants: listItem, ...hoverLift } : {};
  const href = dish.restaurantId ? `/restaurant/${dish.restaurantId}` : null;

  return (
    <Wrapper
      {...motionProps}
      className={cn(
        "group bg-card border-border relative flex flex-col overflow-hidden rounded-md border",
        "shadow-subtle surface-interactive",
        "hover:border-border-strong hover:shadow-raised focus-within:border-ring",
        variant === "compact" && "w-56 shrink-0 snap-start",
      )}
    >
      <SmartImage
        src={dish.image}
        alt=""
        ratio="card"
        fallbackIcon={UtensilsCrossed}
        imgClassName={cn(
          "image-zoom",
          !dish.isAvailable && "opacity-55 saturate-50",
        )}
      >
        {!dish.isAvailable ? (
          <span className="absolute bottom-2 left-2">
            <SoldOutBadge />
          </span>
        ) : (
          dish.discountPercent > 0 && (
            <span className="absolute top-2 left-2">
              <PromoBadge percent={dish.discountPercent} label={dish.promoLabel} />
            </span>
          )
        )}
      </SmartImage>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-h3 text-foreground min-w-0 flex-1">
            {href ? (
              <Link
                to={href}
                className="line-clamp-2 outline-none after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:underline"
              >
                {dish.name}
              </Link>
            ) : (
              <span className="line-clamp-2">{dish.name}</span>
            )}
          </h3>
          <PromoPrice
            price={dish.price}
            basePrice={dish.basePrice}
            className="mt-0.5 shrink-0"
          />
        </div>

        {dish.restaurantName && (
          <p className="text-body-sm text-muted-foreground truncate">
            {dish.restaurantName}
          </p>
        )}

        {variant === "default" && dish.description && (
          <p className="text-body-sm text-muted-foreground line-clamp-2">
            {dish.description}
          </p>
        )}

        {onAdd && (
          <div className="mt-auto pt-2">
            <Button
              variant="secondary"
              size="sm"
              block
              // Raised above the stretched link so the button wins the click.
              className="relative z-20"
              disabled={!dish.isAvailable}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAdd(dish);
              }}
            >
              <Plus aria-hidden="true" />
              {dish.isAvailable ? "Add to basket" : "Unavailable"}
            </Button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

export function DishCardSkeleton({ variant = "default" }) {
  return (
    <div
      className={cn(
        "bg-card border-border overflow-hidden rounded-md border",
        variant === "compact" && "w-56 shrink-0",
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full rounded-sm" />
      </div>
    </div>
  );
}
