import React from "react";
import { Star, Clock, Bike, ChevronRight } from "lucide-react";

const RestaurantHeader = ({ restaurantData, onShowInfoModal }) => {
  return (
    <>
      <div className="relative h-[250px] w-full md:h-[350px]">
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10" />
        <img
          src={restaurantData?.images?.[0] || "/placeholder-cover.jpg"}
          alt={restaurantData?.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-zinc-900 dark:ring-zinc-800 -mt-16 relative z-20">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              {restaurantData?.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {restaurantData?.cuisineType || "Restaurant"} • $
              {restaurantData?.minOrder || "10"} Min order
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-800 shrink-0 overflow-hidden shadow-md">
            <img
              src={restaurantData?.images?.[0] || "/placeholder-logo.jpg"}
              alt={restaurantData?.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>
              {restaurantData?.averageRating ?? "4.5"}{" "}
              <span className="text-blue-600/70 dark:text-blue-400/70 font-normal">
                ({restaurantData?.totalReviews ?? "?"})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4" />
            <span>{restaurantData?.estimatedDeliveryTime || "20-30 min"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Bike className="h-4 w-4" />
            <span>
              {restaurantData?.deliveryFee
                ? `$${restaurantData.deliveryFee}`
                : "Free"}
            </span>
          </div>
          <button
            onClick={onShowInfoModal}
            className="ml-auto text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            More info <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default RestaurantHeader;
