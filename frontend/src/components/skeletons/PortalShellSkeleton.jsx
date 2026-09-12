/**
 * The seller/courier chrome itself - sidebar, header, content column.
 *
 * Used only for the first entry into a portal, while the layout chunk is still
 * downloading and there is no sidebar to keep. It ships in the main bundle
 * precisely because it stands in for a chunk that has not arrived.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PortalShellSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="bg-muted flex min-h-screen overflow-hidden"
    >
      <aside className="bg-card hidden w-72 shrink-0 border-r border-border p-6 lg:block">
        <Skeleton className="mb-8 h-9 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card flex items-center justify-between border-b border-border p-4 lg:hidden">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="size-10 rounded-lg" />
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="hidden space-y-3 lg:block">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>

            <Skeleton className="h-80 rounded-3xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
