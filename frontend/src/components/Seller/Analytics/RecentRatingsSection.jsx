import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/common/SmartImage";

export const RecentRatingsSection = ({ ratings }) => {
  const { t } = useTranslation(["seller", "restaurant", "common"]);
  return (
    <div className="bg-card p-6 rounded-3xl border border-border ">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{t("analytics.recentRatings")}</h3>
        <Link to="/seller/reviews" className="text-sm font-medium text-primary hover:underline">
          {t("restaurant:reviews.seeAll")}
        </Link>
      </div>

      <div className="space-y-4">
        {ratings.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("common:rating.none")}</p>
        )}

        {ratings.map((order, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* The initial fallback used to be ui-avatars.com, which sent every
                reviewer's name to a third party to draw two letters. */}
            <Avatar src={order.customer?.profilePicture} name={order.customer?.name} size="sm" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium ">
                  {order.customer?.name || t("common:fallback.customer")}
                </span>

                <div className="flex">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="w-3.5 h-3.5"
                      fill={
                        s < order.customerRating.restaurantRating
                          ? "#F59E0B"
                          : "none"
                      }
                      stroke={
                        s < order.customerRating.restaurantRating
                          ? "#F59E0B"
                          : "#D1D5DB"
                      }
                    />
                  ))}
                </div>
              </div>

              {order.customerRating.restaurantReview && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {order.customerRating.restaurantReview}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
