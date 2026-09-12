/**
 * "Deals near you" - the promotions rail on discovery.
 *
 * Renders nothing at all when no restaurant nearby is running a promotion.
 * A permanently-present strip that sometimes says "no offers" trains people to
 * scroll past the one place the product advertises real savings, and a strip
 * filled with house placeholders is worse still.
 */

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { staggerContainer } from "@/lib/motion";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { Section, Rail } from "@/components/layout/primitives";
import { InlineError } from "@/components/common/StateViews";
import { PromoCard, PromoCardSkeleton } from "@/components/discovery/PromoCard";

export function PromotionsSection() {
  const { t } = useTranslation("restaurant");
  const { deals, isLoadingPromotions, promotionsError, retryPromotions } =
    useDiscoverStore();
  const { coordinates } = useDeliveryStore();

  if (isLoadingPromotions && deals.length === 0) {
    return (
      <Section title={t("promotions.heading")}>
        <Rail aria-busy="true">
          {[0, 1, 2].map((i) => (
            <PromoCardSkeleton key={i} />
          ))}
        </Rail>
      </Section>
    );
  }

  // A failed promotions request degrades to silence rather than to an error
  // banner: nothing below it depends on the rail, and an error for content the
  // customer never asked for is noise. The retry only appears once a previous
  // load succeeded, where its absence would look like the deals vanished.
  if (promotionsError) {
    if (deals.length === 0) return null;
    return (
      <Section title={t("promotions.heading")}>
        <InlineError
          message={t("promotions.loadError")}
          onRetry={() => retryPromotions(coordinates?.lat, coordinates?.lon)}
        />
      </Section>
    );
  }

  if (deals.length === 0) return null;

  return (
    <Section
      title={t("promotions.heading")}
      description={t("promotions.subtitle")}
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <Rail>
          {deals.map((deal) => (
            <PromoCard key={deal.id} deal={deal} />
          ))}
        </Rail>
      </motion.div>
    </Section>
  );
}
