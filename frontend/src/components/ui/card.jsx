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

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5",
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
