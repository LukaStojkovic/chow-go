/**
 * Layout primitives.
 *
 * These exist so page code stops re-deciding the gutter, the max width and the
 * vertical rhythm on every screen. They intentionally stay thin: they set
 * spacing and width, and pass the semantic element through so headings and
 * landmarks are still the page author's choice.
 */

import { cn } from "@/lib/utils";

/**
 * Content width presets.
 * `feed`     discovery grids and search results - wide enough for 4 columns
 * `reading`  order detail, checkout, profile - keeps line length comfortable
 * `narrow`   single-column forms and confirmations
 */
const WIDTHS = {
  feed: "max-w-[80rem]",
  reading: "max-w-5xl",
  narrow: "max-w-2xl",
  full: "max-w-none",
};

/**
 * The standard page shell: centred, gutter-ed, and padded clear of the mobile
 * bottom navigation.
 *
 * @param {Object} props
 * @param {keyof typeof WIDTHS} [props.width]
 * @param {boolean} [props.withBottomNav] Reserve space for the mobile tab bar.
 * @param {React.ElementType} [props.as]
 */
export function PageContainer({
  as: Component = "div",
  width = "feed",
  withBottomNav = true,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        WIDTHS[width],
        // The tab bar is 3.5rem plus the safe-area inset; it only exists below
        // the `md` breakpoint, so the reservation is dropped above it.
        withBottomNav && "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-10",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * A titled block of content. Renders a real `<section>` with an `<h2>`, so the
 * page outline is navigable, and keeps the heading/action row consistent
 * across every screen that has one.
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action] Right-aligned control, e.g. "See all".
 * @param {2|3} [props.headingLevel]
 */
export function Section({
  title,
  description,
  action,
  headingLevel = 2,
  className,
  headerClassName,
  children,
  ...props
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || action) && (
        <div className={cn("flex items-end justify-between gap-4", headerClassName)}>
          <div className="min-w-0 space-y-1">
            {title && (
              <Heading className="text-h2 text-foreground truncate">{title}</Heading>
            )}
            {description && (
              <p className="text-body-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

const GAPS = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
  "2xl": "gap-8",
};

/**
 * Vertical flow.
 *
 * @param {Object} props
 * @param {keyof typeof GAPS} [props.gap]
 */
export function Stack({ as: Component = "div", gap = "md", className, ...props }) {
  return <Component className={cn("flex flex-col", GAPS[gap], className)} {...props} />;
}

/**
 * Horizontal flow. Wraps by default so long metadata rows never overflow.
 *
 * @param {Object} props
 * @param {keyof typeof GAPS} [props.gap]
 * @param {boolean} [props.wrap]
 */
export function Inline({
  as: Component = "div",
  gap = "sm",
  wrap = true,
  align = "center",
  className,
  ...props
}) {
  return (
    <Component
      className={cn(
        "flex",
        wrap && "flex-wrap",
        align === "center" && "items-center",
        align === "start" && "items-start",
        align === "baseline" && "items-baseline",
        GAPS[gap],
        className,
      )}
      {...props}
    />
  );
}

/**
 * The one grid used for 2D collections. Column counts are fixed presets rather
 * than free-form so cards line up the same way on every screen.
 *
 * `cards`    restaurant / dish cards: 1 -> 2 -> 3 -> 4
 * `wide`     larger cards: 1 -> 2 -> 3
 * `pair`     side-by-side detail blocks: 1 -> 2
 *
 * @param {Object} props
 * @param {"cards"|"wide"|"pair"} [props.variant]
 */
export function ResponsiveGrid({ variant = "cards", className, ...props }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        variant === "cards" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        variant === "wide" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        variant === "pair" && "grid-cols-1 md:grid-cols-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A horizontally scrolling rail. Used for cuisine chips and restaurant
 * carousels. Bleeds to the screen edge on mobile so the last card is visibly
 * cut off - the affordance that tells people it scrolls.
 */
export function Rail({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rail-bleed scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Bottom-pinned action bar for the primary action on mobile (add to basket, go
 * to checkout, place order). Sits above the tab bar and clears the iOS home
 * indicator.
 *
 * @param {Object} props
 * @param {boolean} [props.aboveBottomNav] Offset for the mobile tab bar.
 */
export function StickyActionBar({
  aboveBottomNav = false,
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        "bg-card/95 border-border fixed inset-x-0 z-40 border-t backdrop-blur",
        "px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        aboveBottomNav
          ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
          : "bottom-0",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}

/**
 * The two-column shell used by cart and checkout: a scrolling main column and
 * a summary that sticks on desktop and stacks on mobile.
 */
export function ContentShell({ main, aside, className }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8", className)}>
      <div className="min-w-0 space-y-6">{main}</div>
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">{aside}</aside>
    </div>
  );
}
