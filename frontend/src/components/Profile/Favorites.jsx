import React from "react";
import { Heart, Star } from "lucide-react";

export default function Favorites({ favorites }) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Heart className="text-red-500 fill-red-500" size={20} /> Favorites
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition"
          >
            <div className="text-2xl shrink-0">{fav.img}</div>
            <div className="min-w-0">
              <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {fav.name}
              </h5>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Star
                  size={10}
                  className="fill-yellow-400 text-yellow-400 shrink-0"
                />{" "}
                {fav.rating} • <span className="truncate">{fav.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
