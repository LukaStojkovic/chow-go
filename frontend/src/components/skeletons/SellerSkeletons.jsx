/**
 * One skeleton per seller screen.
 *
 * These serve two moments that used to look different: the lazy route chunk
 * downloading, and the screen's own first query resolving. Both now render the
 * same placeholder, so a slow network shows one continuous shape instead of a
 * spinner that is replaced by a second spinner.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import { OrdersTableSkeleton } from "@/components/skeletons/OrdersTableSkeleton";
import {
  CardBlockSkeleton,
  ChartSkeleton,
  FieldSkeleton,
  ListRowSkeleton,
  PanelSkeleton,
  SkeletonScreen,
  StatCardSkeleton,
} from "@/components/skeletons/primitives";

export function SellerDashboardSkeleton() {
  return (
    <SkeletonScreen label="Loading dashboard" className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <PanelSkeleton className="lg:col-span-2" titleWidth="w-44">
          <ChartSkeleton />
        </PanelSkeleton>

        <PanelSkeleton titleWidth="w-32">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </PanelSkeleton>
      </div>

      <PanelSkeleton titleWidth="w-36">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </PanelSkeleton>
    </SkeletonScreen>
  );
}

export function SellerOrdersSkeleton() {
  return (
    <SkeletonScreen label="Loading orders" className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardBlockSkeleton key={i} titleWidth="w-28">
            <Skeleton className="h-8 w-16" />
          </CardBlockSkeleton>
        ))}
      </div>

      <CardBlockSkeleton titleWidth="w-40">
        <OrdersTableSkeleton rows={5} />
      </CardBlockSkeleton>
    </SkeletonScreen>
  );
}

export function SellerMenuSkeleton() {
  return (
    <SkeletonScreen label="Loading menu" className="space-y-8 pb-10">
      <div className="bg-card space-y-4 rounded-2xl border border-border p-6 shadow-sm">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </SkeletonScreen>
  );
}

export function SellerAnalyticsSkeleton() {
  return (
    <SkeletonScreen label="Loading analytics" className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} showTrend={false} />
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardBlockSkeleton titleWidth="w-36">
            <ChartSkeleton bars={6} />
          </CardBlockSkeleton>
          <CardBlockSkeleton titleWidth="w-40">
            <ChartSkeleton bars={6} />
          </CardBlockSkeleton>
        </div>
      ))}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardBlockSkeleton titleWidth="w-28">
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </CardBlockSkeleton>
        <CardBlockSkeleton titleWidth="w-36">
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListRowSkeleton key={i} trailing={false} />
            ))}
          </div>
        </CardBlockSkeleton>
      </div>
    </SkeletonScreen>
  );
}

export function SellerSettingsSkeleton() {
  return (
    <SkeletonScreen label="Loading settings" className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="size-24 shrink-0 rounded-full" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-2/3 max-w-sm" />
          </div>
        </div>
      </div>

      <CardBlockSkeleton titleWidth="w-48">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
      </CardBlockSkeleton>

      <CardBlockSkeleton titleWidth="w-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
      </CardBlockSkeleton>

      <CardBlockSkeleton titleWidth="w-40">
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-11 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </CardBlockSkeleton>
    </SkeletonScreen>
  );
}
