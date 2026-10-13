import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { staggerContainer } from "@/lib/motion";
import { prefetchRoute } from "@/lib/routeChunks";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { useHomeCollections } from "@/hooks/Collections/useCollections";
import { Rail, Section } from "@/components/layout/primitives";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/discovery/RestaurantCard";
import { DishCard } from "@/components/discovery/DishCard";
import { Button } from "@/components/ui/button";

function CollectionRail({ collection, onAddDish, favourites }) {
  const { t } = useTranslation("discover");

  return (
    <Section
      title={collection.title}
      description={collection.subtitle ?? undefined}
      action={
        collection.hasMore ? (
          <Button asChild variant="link" size="sm">
            <Link
              to={`/collections/${collection.slug}`}
              onMouseEnter={() => prefetchRoute("/collections")}
              onFocus={() => prefetchRoute("/collections")}
              aria-label={t("collections.seeAllLabel", { title: collection.title })}
            >
              {t("collections.seeAll")}
            </Link>
          </Button>
        ) : null
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <Rail>
          {collection.kind === "dishes"
            ? collection.views.map((dish) => (
                <DishCard key={dish.id} dish={dish} variant="compact" onAdd={onAddDish} />
              ))
            : collection.views.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  variant="compact"
                  isFavourite={favourites.isFavourite(restaurant.id)}
                  onToggleFavourite={favourites.toggleFavourite}
                  isTogglingFavourite={favourites.isPending}
                />
              ))}
        </Rail>
      </motion.div>
    </Section>
  );
}

export function CollectionRails({ onAddDish }) {
  const { coordinates } = useDeliveryStore();
  const favourites = useFavourites();
  const { collections, isPending, isError, fetchStatus } = useHomeCollections(coordinates);

  if (isError) return null;

  if (isPending && fetchStatus !== "idle") {
    return (
      <Rail aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <RestaurantCardSkeleton key={i} variant="compact" />
        ))}
      </Rail>
    );
  }

  return collections.map((collection) => (
    <CollectionRail
      key={collection.id}
      collection={collection}
      onAddDish={onAddDish}
      favourites={favourites}
    />
  ));
}
