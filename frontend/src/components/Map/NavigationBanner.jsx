import { Clock, Navigation } from "lucide-react";
import { formatDistance, formatDuration } from "@/utils/mapUtils";
import Spinner from "@/components/Spinner";

export function NavigationBanner({
  destinationLabel,
  distance,
  duration,
  isLoadingRoute,
  onRecenter,
  followMode,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
        <Navigation className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Navigating to
        </p>
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
          {destinationLabel}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {isLoadingRoute ? (
            <Spinner size="sm" />
          ) : (
            <>
              {distance != null && <span>{formatDistance(distance)}</span>}
              {duration != null && (
                <>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(duration)}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {onRecenter && (
        <button
          type="button"
          onClick={onRecenter}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            followMode
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
          }`}
        >
          {followMode ? "Following" : "Recenter"}
        </button>
      )}
    </div>
  );
}
