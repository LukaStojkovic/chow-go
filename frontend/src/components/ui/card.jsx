import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * A grouping surface.
 *
 * Use a card when content genuinely needs to be grouped or is interactive.
 * Plain sections on the page background are the right answer more often than
 * the "every block is a card" habit suggests - reach for `<Section>` first.
 */
const cardVariants = cva("bg-card text-card-foreground rounded-md border border-border", {
  variants: {
    variant: {
      default: "",
      /** Clickable as a whole: gets hover, focus and press affordances. */
      interactive: [
        "transition-[border-color,box-shadow,transform] duration-(--duration-standard) ease-(--ease-standard)",
        "hover:border-border-strong hover:shadow-raised",
        "focus-within:border-ring focus-within:shadow-raised",
        "active:translate-y-px",
      ],
      /** Lifted off the page: summaries, sticky panels. */
      elevated: "shadow-raised",
      /** Sits inside another surface, so it drops its own border. */
      flat: "border-transparent bg-muted",
    },
    padded: { true: "p-4 sm:p-5", false: "" },
  },
  defaultVariants: { variant: "default", padded: false },
});

const Card = React.forwardRef(function Card(
  { className, variant, padded, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ variant, padded }), className)}
      {...props}
    />
  );
});

/**
 * Title block at the top of a card.
 *
 * A column, not a row: every call site passes either a title followed by a
 * description, or one wrapper that lays out its own `justify-between` row. As
 * a row this stretched neither - a lone child shrink-wrapped, so its own
 * `justify-between` had no width to distribute, and a title/description pair
 * was pushed to opposite ends. Column children stretch, which is what both
 * shapes want. Carries no bottom padding: a `CardContent` supplies it. When a
 * header is the card's only child, reach for `CardContent` instead.
 */
function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 px-4 pt-4 sm:px-5 sm:pt-5",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, as: Component = "h3", ...props }) {
  return (
    <Component data-slot="card-title" className={cn("text-h3", className)} {...props} />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-body-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }) {
  return <div data-slot="card-action" className={cn("shrink-0", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return (
    <div data-slot="card-content" className={cn("p-4 sm:p-5", className)} {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "border-border flex items-center gap-3 border-t px-4 py-3 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
