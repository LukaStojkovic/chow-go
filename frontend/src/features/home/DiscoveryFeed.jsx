/**
 * The main discovery feed: dishes from restaurants delivering to this address,
 * filtered by the selected category.
 *
 * Paginated with an explicit "Load more" rather than an infinite scroll -
 * infinite feeds make the page footer unreachable and are hostile to keyboard
 * users, and the sections above this one already do the browsing work.
 */

import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";

import { staggerContainer } from "@/lib/motion";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { CATEGORIES } from "@/lib/constants";
import { Section, ResponsiveGrid } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError } from "@/components/common/StateViews";
import { DishCard, DishCardSkeleton } from "@/components/discovery/DishCard";

/**
 * @param {Object} props
 * @param {(dish: import("@/lib/adapters/types").DishView) => void} props.onAddDish
 */
export function DiscoveryFeed({ onAddDish }) {
  const {
    feedItems,
    isLoadingFeed,
    feedError,
    hasMore,
    activeCategory,
    setActiveCategory,
    loadMore,
    retryFeed,
  } = useDiscoverStore();
  const { coordinates } = useDeliveryStore();

  const categoryLabel =
    CATEGORIES.find((category) => category.value === activeCategory)?.label ?? activeCategory;

  const title = activeCategory === "All" ? "All dishes near you" : categoryLabel;
  const isInitialLoad = isLoadingFeed && feedItems.length === 0;

  if (feedError && feedItems.length === 0) {
    return (
      <Section title={title}>
        <InlineError
          message="We could not load dishes for this category."
          onRetry={() => retryFeed(coordinates?.lat, coordinates?.lon)}
        />
      </Section>
    );
  }

  return (
    <Section title={title}>
      {isInitialLoad ? (
        <ResponsiveGrid aria-busy="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <DishCardSkeleton key={index} />
          ))}
        </ResponsiveGrid>
      ) : feedItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={`No ${activeCategory === "All" ? "dishes" : categoryLabel.toLowerCase()} nearby`}
          description={
            activeCategory === "All"
              ? "No restaurant is delivering to this address right now. Try a different address."
              : "Nothing in this category is available at your address right now."
          }
          action={
            activeCategory !== "All" ? (
              <Button variant="outline" onClick={() => setActiveCategory("All")}>
                Show all dishes
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <ResponsiveGrid>
              {feedItems.map((dish) => (
                <DishCard key={dish.id} dish={dish} onAdd={onAddDish} />
              ))}
            </ResponsiveGrid>
          </motion.div>

          {feedError && (
            <InlineError
              message="Could not load more dishes."
              onRetry={() => retryFeed(coordinates?.lat, coordinates?.lon)}
            />
          )}

          {hasMore && !feedError && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="lg"
                isLoading={isLoadingFeed}
                loadingLabel="Loading more dishes"
                onClick={() => loadMore(coordinates?.lat, coordinates?.lon)}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
