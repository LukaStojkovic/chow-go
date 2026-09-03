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
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm ">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle ">
        <Navigation className="h-5 w-5 text-primary " />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground ">
          Navigating to
        </p>
        <p className="truncate text-sm font-bold text-foreground ">
          {destinationLabel}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground ">
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
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground "
          }`}
        >
          {followMode ? "Following" : "Recenter"}
        </button>
      )}
    </div>
  );
}
