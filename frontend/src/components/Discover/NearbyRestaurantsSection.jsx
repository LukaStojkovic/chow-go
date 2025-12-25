import { RESTAURANTS } from "@/lib/constants";
import { ArrowLeft, ArrowRight, MapPinned } from "lucide-react";
import React, { useRef } from "react";

export default function NearbyRestaurantsSection() {
  const favoritesScrollRef = useRef(null);

  const scrollFavorites = (direction) => {
    if (favoritesScrollRef.current) {
      const { current } = favoritesScrollRef;

      const scrollAmount = direction === "left" ? -340 : 340;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2  sm:text-xl text-sm font-bold text-gray-900 dark:text-white">
          <span className="text-2xl">
            <MapPinned className="h-5 w-5 text-blue-500" />
          </span>{" "}
          Restaurants nearby
        </h2>

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
      </div>

      <div
        ref={favoritesScrollRef}
        className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
      >
        {[...RESTAURANTS, ...RESTAURANTS].map((restaurant, idx) => (
          <div
            key={`fav-${restaurant.id}-${idx}`}
            className="group relative h-48 w-44 shrink-0 cursor-pointer overflow-hidden sm:w-48 rounded-md"
          >
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-4 py-6">
              <span className="truncate text-sm font-semibold text-white drop-shadow-md">
                {restaurant.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
