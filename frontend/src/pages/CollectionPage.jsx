import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { useCollectionPage } from "@/hooks/Collections/useCollections";

import { PageContainer, ResponsiveGrid, Stack } from "@/components/layout/primitives";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/discovery/RestaurantCard";
import { DishCard } from "@/components/discovery/DishCard";
import { ItemCustomizationSheet } from "@/components/basket/ItemCustomizationSheet";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { SmartImage } from "@/components/common/SmartImage";
import { Button } from "@/components/ui/button";

function BackLink() {
  const { t } = useTranslation("discover");
  return (
    <Button asChild variant="outline">
      <Link to="/discovery">
        <ArrowLeft aria-hidden="true" />
        {t("collections.backHome")}
      </Link>
    </Button>
  );
}

export function CollectionPage() {
  const { t } = useTranslation(["discover", "common"]);
  const { slug } = useParams();
  const { coordinates } = useDeliveryStore();
  const { isFavourite, toggleFavourite, isPending } = useFavourites();
  const [selectedDish, setSelectedDish] = useState(null);

  const hasLocation = Boolean(coordinates?.lat && coordinates?.lon);
  const page = useCollectionPage(slug, hasLocation ? coordinates : null);
  const { collection, items, total } = page;

  if (!hasLocation) return <Navigate to="/" replace />;

  let body;
  if (page.isNotFound) {
    body = <EmptyState icon={Sparkles} title={t("collections.notFound")} action={<BackLink />} />;
  } else if (page.isError) {
    body = <ErrorState onRetry={() => page.refetch()} isRetrying={page.isFetching} />;
  } else if (page.isPending) {
    body = (
      <ResponsiveGrid aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </ResponsiveGrid>
    );
  } else {
    const countKey = collection.kind === "dishes" ? "countDishes" : "countRestaurants";
    body = (
      <Stack gap="xl">
        <header className="space-y-3">
          {collection.coverImage && (
            <div className="overflow-hidden rounded-lg">
              <SmartImage src={collection.coverImage} alt="" ratio="hero" loading="eager" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-h1">{collection.title}</h1>
            {collection.subtitle && (
              <p className="text-body text-muted-foreground">{collection.subtitle}</p>
            )}
            <p className="text-body-sm text-muted-foreground">
              {t(`collections.${countKey}`, { count: total })}
            </p>
          </div>
        </header>

        {items.length === 0 ? (
          <EmptyState icon={Sparkles} title={t("collections.empty")} action={<BackLink />} />
        ) : (
          <ResponsiveGrid>
            {collection.kind === "dishes"
              ? items.map((dish) => (
                  <DishCard key={dish.id} dish={dish} onAdd={setSelectedDish} animate={false} />
                ))
              : items.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isFavourite={isFavourite(restaurant.id)}
                    onToggleFavourite={toggleFavourite}
                    isTogglingFavourite={isPending}
                    animate={false}
                  />
                ))}
          </ResponsiveGrid>
        )}

        {page.hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => page.fetchNextPage()}
              isLoading={page.isFetchingNextPage}
            >
              {t("collections.loadMore")}
            </Button>
          </div>
        )}
      </Stack>
    );
  }

  return (
    <>
      <PageContainer className="py-5 sm:py-6">{body}</PageContainer>
      <ItemCustomizationSheet dish={selectedDish} onClose={() => setSelectedDish(null)} />
    </>
  );
}
export default CollectionPage;
