/**
 * Saved restaurants.
 *
 * The favourites endpoint returns full restaurant documents, so these are the
 * same cards as everywhere else - including live open/closed state, which is
 * the thing that actually decides whether a saved restaurant is useful right
 * now.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";

import { staggerContainer } from "@/lib/motion";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { useFavourites } from "@/hooks/Favourites/useFavourites";

import { PageContainer, ResponsiveGrid, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/StateViews";
import {
  RestaurantCard,
  RestaurantCardSkeleton,
} from "@/components/discovery/RestaurantCard";

export default function FavouritesPage() {
  const { t } = useTranslation(["restaurant", "common"]);
  const { favourites, isLoading, toggleFavourite, isPending } = useFavourites();
  const restaurants = toRestaurantViews(favourites);

  return (
    <PageContainer className="py-6">
      <Stack gap="lg">
        <div className="space-y-1">
          <h1 className="text-h1">{t("restaurant:favourites.title")}</h1>
          <p className="text-body-sm text-muted-foreground">
            {isLoading
              ? t("restaurant:favourites.loading")
              : restaurants.length === 0
                ? t("restaurant:favourites.subtitleEmpty")
                : t("restaurant:favourites.savedCount", { count: restaurants.length })}
          </p>
        </div>

        {isLoading ? (
          <ResponsiveGrid aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </ResponsiveGrid>
        ) : restaurants.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t("restaurant:favourites.empty.title")}
            description={t("restaurant:favourites.empty.description")}
            action={
              <Button asChild>
                <Link to="/discovery">{t("restaurant:favourites.empty.action")}</Link>
              </Button>
            }
          />
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <ResponsiveGrid>
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavourite
                  onToggleFavourite={toggleFavourite}
                  isTogglingFavourite={isPending}
                />
              ))}
            </ResponsiveGrid>
          </motion.div>
        )}
      </Stack>
    </PageContainer>
  );
}
