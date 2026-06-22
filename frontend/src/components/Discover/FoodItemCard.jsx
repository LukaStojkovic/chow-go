import React, { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FoodItemCard({ item }) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageUrls =
    item.imageUrls?.length > 0
      ? item.imageUrls
      : ["https://placehold.co/400x300"];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === imageUrls.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? imageUrls.length - 1 : prev - 1,
    );
  };

  return (
    <div
      onClick={() => navigate(`/restaurant/${item.restaurant?._id}`)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 h-full w-full"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {imageUrls.map((url, idx) => (
            <img
              key={`${item._id}-img-${idx}`}
              src={url}
              alt={`${item.name} - ${idx + 1}`}
              className="h-full w-full flex-shrink-0 object-cover"
            />
          ))}
        </div>

        {imageUrls.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
              {imageUrls.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    idx === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {item.price && (
          <div className="absolute top-3 right-3 rounded-xl bg-white/90 px-3 py-1.5 text-sm font-bold text-gray-900 shadow-sm backdrop-blur-md dark:bg-zinc-900/90 dark:text-white z-10">
            ${item.price.toFixed(2)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-bold text-gray-900 dark:text-white text-lg">
          {item.name}
        </h3>
        {item.restaurant && (
          <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
            From {item.restaurant.name}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-xs text-gray-400 dark:text-gray-500 flex-1">
          {item.description}
        </p>

        <button className="mt-4 cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700">
          <Plus className="h-4 w-4" /> View Menu
        </button>
      </div>
    </div>
  );
}
