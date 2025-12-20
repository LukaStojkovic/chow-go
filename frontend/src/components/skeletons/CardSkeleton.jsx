export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow animate-pulse">
      <div className="aspect-video bg-muted rounded-t-xl" />
      <div className="p-5 space-y-4">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="flex justify-between items-center pt-4">
          <div className="h-5 bg-muted rounded w-24" />
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-muted rounded" />
            <div className="h-9 w-9 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
