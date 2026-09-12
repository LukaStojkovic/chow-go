/**
 * "New in town" - restaurants that joined in the last 30 days.
 *
 * Derived from `createdAt`, so it is a fact rather than an editorial slot. Like
 * the deals rail, it disappears entirely when there is nothing to show: a
 * section that renders an empty state on most days is a section that has taught
 * people to skip it.
 */

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/motion";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { Section } from "@/components/layout/primitives";
import {
  RestaurantCard,
  RestaurantCardSkeleton,
} from "@/components/discovery/RestaurantCard";

export function NewInTownSection() {
  const { t } = useTranslation("restaurant");
  const { newRestaurants, isLoadingPromotions, promotionsError } = useDiscoverStore();
  const { isFavourite, toggleFavourite, isPending } = useFavourites();

  if (isLoadingPromotions && newRestaurants.length === 0) {
    return (
      <Section title={t("newInTown.heading")}>
        <div className="rail-bleed scrollbar-hide flex gap-4 overflow-x-auto" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <RestaurantCardSkeleton key={i} variant="compact" className="lg:w-auto lg:shrink" />
          ))}
        </div>
      </Section>
    );
  }

  if (promotionsError || newRestaurants.length === 0) return null;

  return (
    <Section
      title={t("newInTown.heading")}
      description={t("newInTown.subtitle")}
    >
      {/* Same rail-to-grid switch as "Restaurants near you", so the two read as
          one system rather than two components that happen to sit together. */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={cn(
          "rail-bleed scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-1",
          "lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-4",
        )}
      >
        {newRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            variant="compact"
            className="lg:w-auto lg:shrink"
            isFavourite={isFavourite(restaurant.id)}
            onToggleFavourite={toggleFavourite}
            isTogglingFavourite={isPending}
          />
        ))}
      </motion.div>
    </Section>
  );
}
