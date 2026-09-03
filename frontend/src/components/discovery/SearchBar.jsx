/**
 * Search input.
 *
 * A real `<form role="search">` with a labelled `type="search"` field, so it
 * submits on Enter, clears on Escape, and is reachable by the "search"
 * landmark. The busy state is announced rather than shown only as a spinner.
 */

import { forwardRef } from "react";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {() => void} [props.onSubmit]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.isSearching]
 * @param {boolean} [props.autoFocus]
 * @param {string} [props.label] Accessible name for the field.
 */
export const SearchBar = forwardRef(function SearchBar(
  {
    value,
    onChange,
    onSubmit,
    placeholder = "Search restaurants or dishes",
    isSearching = false,
    autoFocus = false,
    label = "Search restaurants and dishes",
    className,
  },
  ref,
) {
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <label htmlFor="app-search" className="sr-only">
        {label}
      </label>

      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />

      <input
        ref={ref}
        id="app-search"
        type="search"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            onChange("");
          }
        }}
        className={cn(
          "bg-card border-input text-foreground placeholder:text-muted-foreground",
          "h-11 w-full rounded-sm border pl-9 text-base md:text-body",
          value ? "pr-10" : "pr-3",
          "transition-[border-color,box-shadow] duration-(--duration-micro)",
          "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
          // Safari and Chrome each add their own clear affordance; ours is
          // labelled and keyboard-reachable, so theirs is removed.
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />

      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {isSearching && (
          <>
            <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden="true" />
            <span className="sr-only" role="status">
              Searching
            </span>
          </>
        )}
        {value && !isSearching && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 items-center justify-center rounded-full",
              "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
});
