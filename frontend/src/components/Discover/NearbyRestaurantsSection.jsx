import useGetNearbyRestaurants from "@/hooks/Location/useGetNearbyRestaurants";
import {
  MapPinned,
  ArrowLeft,
  ArrowRight,
  Star,
  Clock,
  Bike,
  ForkKnife,
} from "lucide-react";
import React, { useRef } from "react";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import NearbyRestaurantCardSkeleton from "../skeletons/NearbyRestaurantsCardSkeleton";
import { Link } from "react-router-dom";

export default function NearbyRestaurantsSection() {
  const favoritesScrollRef = useRef(null);
  const { coordinates } = useDeliveryStore();
  const { lat, lon } = coordinates || {};
  const { nearbyRestaurants, isLoading } = useGetNearbyRestaurants(lat, lon);

  const scrollFavorites = (direction) => {
    if (favoritesScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      favoritesScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const hasRestaurants = nearbyRestaurants && nearbyRestaurants.length > 0;

  return (
    <section className="relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm sm:text-xl font-bold text-gray-900 dark:text-white">
          <MapPinned className="h-5 w-5 text-blue-500" />
          Restaurants nearby
        </h2>

        {hasRestaurants && !isLoading && (
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scrollFavorites("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollFavorites("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={favoritesScrollRef}
        className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
      >
        {isLoading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <NearbyRestaurantCardSkeleton key={`skeleton-${idx}`} />
          ))}

        {!isLoading && !hasRestaurants && (
          <div className="flex w-full items-center justify-center py-12">
            <div className="text-center">
              <MapPinned className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-700 mb-4" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                No restaurants nearby
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Try adjusting your location or zoom out to see more options.
              </p>
            </div>
          </div>
        )}

        {!isLoading &&
          hasRestaurants &&
          nearbyRestaurants.map((restaurant, idx) => (
            <Link
              key={`fav-${restaurant._id}-${idx}`}
              to={`/restaurant/${restaurant._id}`}
              className="group relative h-48 w-44 shrink-0 overflow-hidden rounded-xl sm:w-48 block"
            >
              <div className="h-full w-full overflow-hidden rounded-xl">
                <img
                  src={restaurant.images[0] || <ForkKnife />}
                  alt={restaurant.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-3 pt-8 pb-3">
                <h3 className="truncate text-base font-bold text-white drop-shadow-md">
                  {restaurant.name}
                </h3>

                <p className="mt-1 text-xs font-medium text-gray-200">
                  {restaurant.cuisineType}
                </p>

                <div className="mt-2 flex items-center gap-1">
                  {restaurant.averageRating > 0 ? (
                    <>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">
                        {restaurant.averageRating.toFixed(1)}
                      </span>
                      {restaurant.totalReviews > 0 && (
                        <span className="text-xs text-gray-300">
                          ({restaurant.totalReviews})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-300">
                      No ratings yet
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-200">
                    <Bike className="h-3.5 w-3.5" />
                    <span>{restaurant.estimatedDeliveryTime}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span
                      className={
                        restaurant.isOpenNow
                          ? "font-medium text-emerald-400"
                          : "font-medium text-red-400"
                      }
                    >
                      {restaurant.isOpenNow ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
