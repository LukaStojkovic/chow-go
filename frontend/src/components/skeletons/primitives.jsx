/**
 * Building blocks shared by the route-level skeletons.
 *
 * Each one mirrors the real component's box model - same radius, padding,
 * border and grid position - so the swap from skeleton to content moves
 * nothing. Getting that wrong is worse than a spinner: it looks like the page
 * settled, then jumped.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Wraps a whole screen's placeholder. One busy announcement per route, rather
 * than one per skeleton block.
 */
export function SkeletonScreen({ label = "Loading", className, children }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={className}>
      {children}
    </div>
  );
}

/** Mirrors `@/components/ui/StatCard`. */
export function StatCardSkeleton({ showTrend = true }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="size-12 rounded-xl" />
      </div>
      {showTrend && <Skeleton className="h-5 w-36 rounded-full" />}
    </div>
  );
}

/** The large `rounded-3xl` panel the seller dashboard is built from. */
export function PanelSkeleton({ className, titleWidth = "w-40", children }) {
  return (
    <div
      className={cn(
        "bg-card rounded-3xl border border-border p-8 shadow-sm",
        className,
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className={cn("h-6", titleWidth)} />
        <Skeleton className="size-5 rounded-sm" />
      </div>
      {children}
    </div>
  );
}

/**
 * A chart placeholder drawn as a bar silhouette rather than one flat block -
 * a plain rectangle reads as a broken image at this size.
 */
export function ChartSkeleton({ bars = 7, className }) {
  const heights = ["h-16", "h-28", "h-20", "h-36", "h-24", "h-32", "h-20"];

  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-3">
          <Skeleton className={cn("w-full rounded-md", heights[i % heights.length])} />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

/** Avatar, two lines, trailing value - the popular-items and ratings shape. */
export function ListRowSkeleton({ avatar = true, trailing = true }) {
  return (
    <div className="flex items-center gap-4">
      {avatar && <Skeleton className="size-12 shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      {trailing && (
        <div className="shrink-0 space-y-2 text-right">
          <Skeleton className="ml-auto h-4 w-14" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
      )}
    </div>
  );
}

/** A labelled input, for the settings and profile forms. */
export function FieldSkeleton({ className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/** Mirrors `@/components/ui/card`. */
export function CardBlockSkeleton({ titleWidth = "w-44", className, children }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>
      <div className="space-y-2 p-6 pb-4">
        <Skeleton className={cn("h-5", titleWidth)} />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
      <div className="p-6 pt-0">{children}</div>
    </div>
  );
}
