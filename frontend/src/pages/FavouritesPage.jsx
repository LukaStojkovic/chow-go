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
import { Heart } from "lucide-react";

import { staggerContainer } from "@/lib/motion";
import { toRestaurantViews } from "@/lib/adapters/restaurant";
import { useFavourites } from "@/hooks/Favourites/useFavourites";

import { PageContainer, ResponsiveGrid, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/StateViews";
import {
  RestaurantCard,
  RestaurantCardSkeleton,
} from "@/components/discovery/RestaurantCard";

export default function FavouritesPage() {
  const { favourites, isLoading, toggleFavourite, isPending } = useFavourites();
  const restaurants = toRestaurantViews(favourites);

  return (
    <PageContainer className="py-6">
      <Stack gap="lg">
        <div className="space-y-1">
          <h1 className="text-h1">Favourites</h1>
          <p className="text-body-sm text-muted-foreground">
            {isLoading
              ? "Loading your saved restaurants"
              : restaurants.length === 0
                ? "Restaurants you save appear here"
                : `${restaurants.length} saved ${restaurants.length === 1 ? "restaurant" : "restaurants"}`}
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
            title="No favourites yet"
            description="Tap the heart on any restaurant to save it here for next time."
            action={
              <Button asChild>
                <Link to="/discovery">Find restaurants</Link>
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
