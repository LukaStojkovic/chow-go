import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badges carry status, never decoration. Every variant pairs a tinted surface
 * with a foreground that meets contrast on it, so the text is readable without
 * the colour being the only signal - the label always says what it means.
 */
const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap",
    "rounded-xs px-2 py-0.5 text-caption font-semibold",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        primary: "bg-primary-subtle text-primary-subtle-foreground",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        destructive: "bg-destructive-subtle text-destructive",
        info: "bg-info-subtle text-info",
        /** Solid, for a badge sitting on top of a photo. */
        solid: "bg-primary text-primary-foreground shadow-subtle",
        /** Promotions and deals. Blue, so a discount never reads as a warning
            and never competes with the green primary action. */
        promo: "bg-info text-info-foreground shadow-subtle",
        /** Reads on top of imagery without tinting it. */
        overlay: "bg-card/92 text-foreground shadow-subtle backdrop-blur-sm",
        outline: "border border-border-strong text-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[0.6875rem]",
        md: "px-2 py-0.5 text-caption",
        lg: "px-2.5 py-1 text-label",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

const Badge = React.forwardRef(function Badge(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { Badge, badgeVariants };
