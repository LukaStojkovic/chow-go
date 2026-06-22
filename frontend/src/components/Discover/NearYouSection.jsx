import FoodItemCard from "./FoodItemCard";
import { MapPin, Loader2 } from "lucide-react";

export default function NearYouSection({ items, isLoading }) {
  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 sm:text-xl text-sm font-bold text-gray-900 dark:text-white">
          <MapPin className="h-5 w-5 text-blue-500" />
          Near You
        </h2>
        <div className="flex gap-2">
          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium dark:bg-zinc-800">
            Rating 4.5+
          </span>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium dark:bg-zinc-800">
            Under 30 min
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <FoodItemCard key={`near-${item._id}-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
}
