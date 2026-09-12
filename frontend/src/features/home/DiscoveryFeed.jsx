/**
 * The main discovery feed: dishes from restaurants delivering to this address,
 * filtered by the selected category.
 *
 * Paginated with an explicit "Load more" rather than an infinite scroll -
 * infinite feeds make the page footer unreachable and are hostile to keyboard
 * users, and the sections above this one already do the browsing work.
 */

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { UtensilsCrossed } from "lucide-react";

import { staggerContainer } from "@/lib/motion";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useCategories } from "@/lib/constants";
import { Section, ResponsiveGrid } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError } from "@/components/common/StateViews";
import { DishCard, DishCardSkeleton } from "@/components/discovery/DishCard";

/**
 * @param {Object} props
 * @param {(dish: import("@chowgo/shared/adapters/types").DishView) => void} props.onAddDish
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
  const { t } = useTranslation("discover");
  const categories = useCategories();

  const isAllCategories = activeCategory === "All";
  const categoryLabel =
    categories.find((category) => category.value === activeCategory)?.label ?? activeCategory;

  const title = isAllCategories ? t("feed.allTitle") : categoryLabel;
  const isInitialLoad = isLoadingFeed && feedItems.length === 0;

  if (feedError && feedItems.length === 0) {
    return (
      <Section title={title}>
        <InlineError
          message={t("feed.loadError")}
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
          title={
            isAllCategories
              ? t("feed.emptyAllTitle")
              : t("feed.emptyCategoryTitle", { category: categoryLabel })
          }
          description={
            isAllCategories ? t("feed.emptyAllBody") : t("feed.emptyCategoryBody")
          }
          action={
            isAllCategories ? null : (
              <Button variant="outline" onClick={() => setActiveCategory("All")}>
                {t("feed.showAll")}
              </Button>
            )
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
              message={t("feed.loadMoreError")}
              onRetry={() => retryFeed(coordinates?.lat, coordinates?.lon)}
            />
          )}

          {hasMore && !feedError && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="lg"
                isLoading={isLoadingFeed}
                loadingLabel={t("feed.loadingMore")}
                onClick={() => loadMore(coordinates?.lat, coordinates?.lon)}
              >
                {t("feed.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
