import { Star } from "lucide-react";

export const RecentRatingsSection = ({ ratings }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white">Recent Ratings</h3>

      <div className="space-y-4">
        {ratings.length === 0 && (
          <p className="text-sm text-gray-400">No ratings yet.</p>
        )}

        {ratings.map((order, i) => (
          <div key={i} className="flex items-start gap-3">
            <img
              src={
                order.customer?.profilePicture ||
                `https://ui-avatars.com/api/?name=${order.customer?.name}`
              }
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-white">
                  {order.customer?.name || "Customer"}
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
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
