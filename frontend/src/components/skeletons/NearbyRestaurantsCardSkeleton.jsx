export default function NearbyRestaurantCardSkeleton() {
  return (
    <div className="group relative h-48 w-44 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse">
      <div className="h-full w-full bg-gray-300 dark:bg-zinc-700" />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-4 py-6">
        <div className="h-5 w-32 rounded bg-gray-200/80 dark:bg-zinc-600" />
      </div>
    </div>
  );
}
