import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Variants map onto real roles, not decoration:
 *   primary      the one action a region is asking for
 *   secondary    a supporting action next to a primary one
 *   outline      an equal-weight alternative
 *   ghost        low-emphasis, usually icon-only or in a toolbar
 *   destructive  removes or cancels something
 *   link         inline navigation inside prose
 */
const buttonVariants = cva(
  [
    // `relative` sits in the base rather than being appended after `className`:
    // appended, tailwind-merge strips an `absolute` the caller passed and drops
    // the button back into normal flow.
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-sm text-label font-semibold",
    // Transform is in the list for the press: a button that only changes
    // colour on `:active` gives no sense of having been pushed.
    "transition-[color,background-color,border-color,box-shadow,opacity,transform]",
    "duration-(--duration-micro) ease-(--ease-standard)",
    "active:scale-[0.97]",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-55",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-subtle hover:shadow-raised",
        /** Alias kept so shadcn primitives calling buttonVariants still resolve. */
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-subtle hover:shadow-raised",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        outline:
          "border border-border-strong bg-card text-foreground hover:bg-muted hover:border-border-strong",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-subtle",
        link: "text-primary underline-offset-4 hover:underline h-auto p-0",
      },
      size: {
        /** Compact controls inside dense rows. */
        sm: "h-9 px-3",
        /** The default. 40px keeps text buttons comfortable on desktop. */
        md: "h-10 px-4",
        /** Alias for the shadcn default, so existing call sites keep working. */
        default: "h-10 px-4",
        /** Primary actions and anything thumb-operated: 48px touch target. */
        lg: "h-12 px-6 text-body font-semibold",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
      /** Sticky mobile actions and form submits span their container. */
      block: { true: "w-full", false: "" },
    },
    compoundVariants: [
      { variant: "link", size: ["sm", "md", "lg", "default"], class: "h-auto px-0" },
    ],
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

/**
 * @param {Object} props
 * @param {boolean} [props.isLoading] Shows a spinner and blocks interaction.
 *   Width is held steady by keeping the label mounted, so nothing reflows.
 * @param {string} [props.loadingLabel] Announced to screen readers while busy.
 */
const Button = React.forwardRef(function Button(
  {
    className,
    variant,
    size,
    block,
    asChild = false,
    isLoading = false,
    loadingLabel = "Working",
    disabled,
    children,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";

  // `asChild` forwards to a single element (a Link, usually) - injecting a
  // spinner would break Slot's single-child contract.
  if (asChild) {
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          </span>
          <span className="sr-only" role="status">
            {loadingLabel}
          </span>
        </>
      )}
      <span
        className={cn("contents", isLoading && "invisible")}
        aria-hidden={isLoading || undefined}
      >
        {children}
      </span>
    </button>
  );
});

export { Button, buttonVariants };
