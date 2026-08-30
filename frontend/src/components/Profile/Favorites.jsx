import React from "react";
import { Heart, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CUISINE_EMOJIS = {
  fast_food: "🍔",
  italian: "🍝",
  chinese: "🥡",
  indian: "🍛",
  mexican: "🌮",
  japanese: "🍣",
  thai: "🍜",
  pizza: "🍕",
  burgers: "🍔",
  healthy: "🥗",
  desserts: "🍰",
  serbian: "🥩",
  mediterranean: "🫒",
};

export default function Favorites({ favourites, onRemoveFavourite, isToggling }) {
  const navigate = useNavigate();

  if (!favourites || favourites.length === 0) {
    return (
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" size={20} /> Favorites
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No favourites yet. Browse restaurants and tap the heart to save your favorites!
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Heart className="text-red-500 fill-red-500" size={20} /> Favorites
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favourites.map((fav) => (
          <div
            key={fav._id}
            className="group relative flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition"
            onClick={() => navigate(`/restaurant/${fav._id}`)}
          >
            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700">
              {fav.profilePicture ? (
                <img
                  src={fav.profilePicture}
                  alt={fav.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">
                  {CUISINE_EMOJIS[fav.cuisineType] || "🍽️"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {fav.name}
              </h5>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Star
                  size={10}
                  className="fill-yellow-400 text-yellow-400 shrink-0"
                />{" "}
                {fav.averageRating?.toFixed(1) || "0.0"} •{" "}
                <span className="truncate">
                  {fav.cuisineType?.replace(/_/g, " ") || "Restaurant"}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFavourite(fav._id);
              }}
              disabled={isToggling}
              className="opacity-0 cursor-pointer group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
              title="Remove from favourites"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
