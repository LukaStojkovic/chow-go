/**
 * "Popular right now".
 *
 * Ranked by actual order volume in the customer's delivery area, with a
 * recency fallback when there is not enough order history nearby - so this is
 * a real signal, not a curated-looking shelf of arbitrary items.
 */

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { staggerContainer } from "@/lib/motion";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { Section, Rail } from "@/components/layout/primitives";
import { InlineError } from "@/components/common/StateViews";
import { DishCard, DishCardSkeleton } from "@/components/discovery/DishCard";

/**
 * @param {Object} props
 * @param {(dish: import("@chowgo/shared/adapters/types").DishView) => void} props.onAddDish
 */
export function PopularDishesSection({ onAddDish }) {
  const { t } = useTranslation("restaurant");
  const { popularItems, isLoadingPopular, popularError, fetchPopular } = useDiscoverStore();
  const { coordinates } = useDeliveryStore();

  if (popularError) {
    return (
      <Section title={t("popular.heading")}>
        <InlineError
          message={t("popular.loadError")}
          onRetry={() => fetchPopular(coordinates?.lat, coordinates?.lon)}
        />
      </Section>
    );
  }

  if (isLoadingPopular && popularItems.length === 0) {
    return (
      <Section title={t("popular.heading")}>
        <Rail aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <DishCardSkeleton key={i} variant="compact" />
          ))}
        </Rail>
      </Section>
    );
  }

  // Not an error and not worth an empty state - a new delivery area simply has
  // no order history yet, and the sections below still have content.
  if (popularItems.length === 0) return null;

  return (
    <Section
      title={t("popular.heading")}
      description={t("popular.subtitle")}
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <Rail>
          {popularItems.map((dish) => (
            <DishCard key={dish.id} dish={dish} variant="compact" onAdd={onAddDish} />
          ))}
        </Rail>
      </motion.div>
    </Section>
  );
}
