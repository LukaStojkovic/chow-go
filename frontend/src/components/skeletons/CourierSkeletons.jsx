/**
 * One skeleton per courier screen. Same contract as the seller set - the lazy
 * chunk and the first query share a placeholder.
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  CardBlockSkeleton,
  ChartSkeleton,
  ListRowSkeleton,
  SkeletonScreen,
  StatCardSkeleton,
} from "@/components/skeletons/primitives";

/** Matches `@/components/Courier/components/CourierOrderCard`. */
export function CourierOrderCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="mt-5 space-y-4 pl-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-56 max-w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3.5 w-48 max-w-full" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}

/** Stands in for `StatsGrid` - three rows of three. */
function CourierStatsGridSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} showTrend={row === 2} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CourierDashboardSkeleton() {
  return (
    <SkeletonScreen
      label="Loading dashboard"
      className="mx-auto max-w-5xl space-y-6"
    >
      <CourierStatsGridSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardBlockSkeleton titleWidth="w-36">
          <ChartSkeleton bars={7} />
        </CardBlockSkeleton>
        <CardBlockSkeleton titleWidth="w-40">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListRowSkeleton key={i} avatar={false} />
            ))}
          </div>
        </CardBlockSkeleton>
      </div>
    </SkeletonScreen>
  );
}

export function CourierOrdersSkeleton() {
  return (
    <SkeletonScreen label="Loading deliveries" className="space-y-6">
      <div className="bg-secondary/50 flex gap-1 rounded-xl p-1">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CourierOrderCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonScreen>
  );
}

export function CourierProfileSkeleton() {
  return (
    <SkeletonScreen label="Loading profile" className="mx-auto max-w-3xl space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="size-28 shrink-0 rounded-full" />
          <div className="w-full flex-1 space-y-3 text-center sm:text-left">
            <Skeleton className="mx-auto h-7 w-48 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-56 sm:mx-0" />
            <div className="flex justify-center gap-2 sm:justify-start">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card space-y-2 rounded-2xl border border-border p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <Skeleton className="size-5 rounded-sm" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <ListRowSkeleton key={j} avatar={false} trailing={false} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}

/**
 * The delivery screen is a full-bleed map with a docked panel, so its skeleton
 * has to fill the same flex column rather than sit in the scrolling body.
 */
export function CourierDeliverySkeleton() {
  return (
    <SkeletonScreen
      label="Loading delivery"
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <Skeleton className="min-h-0 flex-1 rounded-none" />

      <div className="bg-card shrink-0 space-y-4 border-t border-border p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </SkeletonScreen>
  );
}
