import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Text input.
 *
 * 44px tall so it clears the minimum touch target on mobile, and `text-base`
 * below `md` because iOS Safari zooms the viewport on focus for anything under
 * 16px.
 */
const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-card text-foreground placeholder:text-muted-foreground",
        "h-11 w-full min-w-0 rounded-sm border px-3 text-base md:h-10 md:text-body",
        "transition-[color,border-color,box-shadow] duration-(--duration-micro)",
        "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25",
        "file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-label",
        className,
      )}
      {...props}
    />
  );
});

export { Input };
