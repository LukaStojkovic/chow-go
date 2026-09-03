import { cn } from "@/lib/utils";

/**
 * A loading placeholder.
 *
 * Skeletons must be sized to the content they stand in for - a skeleton that
 * does not match its final layout causes exactly the layout shift it was meant
 * to prevent. Screen readers skip them; the surrounding region announces its
 * own busy state instead.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("bg-muted animate-pulse rounded-sm", className)}
      {...props}
    />
  );
}

export { Skeleton };
