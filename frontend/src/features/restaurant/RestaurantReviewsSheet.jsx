import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ResponsiveSheet } from "@/components/basket/ResponsiveSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard, ReviewFilters, ReviewSummary } from "@/components/reviews/ReviewParts";
import { useRestaurantReviews } from "@/hooks/Reviews/useReviews";

export function RestaurantReviewsSheet({ open, onClose, restaurant }) {
  const { t } = useTranslation("restaurant");
  const [filter, setFilter] = useState("all");
  const reviews = useRestaurantReviews(restaurant.id, filter, { enabled: open });
  const { summary: unfilteredSummary } = useRestaurantReviews(restaurant.id, "all", {
    enabled: open,
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t("restaurant:reviews.title")}
    >
      <div className="space-y-5 p-4 sm:p-5">
        {reviews.isLoading && !unfilteredSummary ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            <ReviewSummary summary={unfilteredSummary} />
            {(unfilteredSummary?.count ?? 0) > 0 && (
              <ReviewFilters value={filter} onChange={setFilter} />
            )}
          </>
        )}

        {reviews.isError ? (
          <p className="text-body-sm text-destructive">{t("error.loadDescription")}</p>
        ) : !reviews.isLoading && reviews.reviews.length === 0 ? (
          <p className="text-body-sm text-muted-foreground py-6 text-center">
            {t("restaurant:reviews.empty")}
          </p>
        ) : (
          <div>
            {reviews.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} restaurantName={restaurant.name} />
            ))}
          </div>
        )}

        {reviews.hasNextPage && (
          <Button
            variant="outline"
            block
            onClick={() => reviews.fetchNextPage()}
            isLoading={reviews.isFetchingNextPage}
          >
            {t("restaurant:reviews.loadMore")}
          </Button>
        )}
      </div>
    </ResponsiveSheet>
  );
}
