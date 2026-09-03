/**
 * "Restaurants near you".
 *
 * A rail on mobile and tablet - horizontal scanning suits a short, ranked list
 * and costs no vertical space - and a grid from `lg` up, where there is room
 * to show the whole set at once without a scroll affordance nobody can see on
 * a trackpad.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPinned } from "lucide-react";

import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/motion";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import useGetNearbyRestaurants from "@/hooks/Location/useGetNearbyRestaurants";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { Section } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError } from "@/components/common/StateViews";
import {
  RestaurantCard,
  RestaurantCardSkeleton,
} from "@/components/discovery/RestaurantCard";

const RAIL_LIMIT = 10;

export function NearbyRestaurantsSection() {
  const { coordinates } = useDeliveryStore();
  const { restaurants, isLoading, error, refetch } = useGetNearbyRestaurants(
    coordinates?.lat,
    coordinates?.lon,
  );
  const { isFavourite, toggleFavourite, isPending } = useFavourites();

  const visible = restaurants.slice(0, RAIL_LIMIT);

  if (error) {
    return (
      <Section title="Restaurants near you">
        <InlineError
          message="We could not load restaurants near you."
          onRetry={() => refetch()}
        />
      </Section>
    );
  }

  if (isLoading) {
    return (
      <Section title="Restaurants near you">
        <div
          aria-busy="true"
          className="rail-bleed scrollbar-hide flex gap-4 overflow-x-auto lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0 xl:grid-cols-4"
        >
          {[0, 1, 2, 3].map((i) => (
            <RestaurantCardSkeleton key={i} variant="compact" className="lg:w-auto lg:shrink" />
          ))}
        </div>
      </Section>
    );
  }

  if (visible.length === 0) {
    return (
      <Section title="Restaurants near you">
        <EmptyState
          icon={MapPinned}
          size="sm"
          title="Nothing delivering here yet"
          description="No restaurant covers this address right now. Try another saved address, or check back a little later."
        />
      </Section>
    );
  }

  return (
    <Section
      title="Restaurants near you"
      description={`${restaurants.length} delivering to your address`}
      action={
        restaurants.length > RAIL_LIMIT ? (
          <Button variant="link" size="sm" asChild>
            <Link to="/search">See all</Link>
          </Button>
        ) : null
      }
    >
      {/* One list, two presentations. A horizontal rail up to `lg`, where
          vertical space is scarce, and a grid above it, where a scroll
          affordance is invisible on a trackpad. Rendering both and toggling
          with `hidden` would put every card in the DOM twice. */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={cn(
          "rail-bleed scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-1",
          "lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-4",
        )}
      >
        {visible.map((restaurant) => (
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
