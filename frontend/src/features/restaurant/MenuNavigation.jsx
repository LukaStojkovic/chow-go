/**
 * Sticky menu navigation.
 *
 * A tablist over the menu sections plus a filter field. It sticks below the
 * app header, which is why the offset is a token rather than a magic number
 * repeated in two files.
 *
 * The active section is derived from scroll position with an IntersectionObserver
 * rather than from the last thing clicked, so scrolling by hand keeps the
 * navigation honest.
 */

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

/** Height of the sticky app header (h-14 mobile, h-16 from sm). */
export const HEADER_OFFSET = "top-14 sm:top-16";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").MenuSectionView[]} props.sections
 * @param {string} props.activeSection
 * @param {(id: string) => void} props.onSelectSection
 * @param {string} props.query
 * @param {(value: string) => void} props.onQueryChange
 */
export function MenuNavigation({
  sections,
  activeSection,
  onSelectSection,
  query,
  onQueryChange,
}) {
  const listRef = useRef(null);

  // Keep the active tab in view as the page scrolls past sections, so the
  // navigation never shows a selected item that is off-screen.
  useEffect(() => {
    const active = listRef.current?.querySelector('[aria-selected="true"]');
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeSection]);

  return (
    <div
      className={cn(
        "bg-background/95 border-border sticky z-20 -mx-4 border-b px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6",
        HEADER_OFFSET,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-40 shrink-0 sm:w-56">
          <label htmlFor="menu-filter" className="sr-only">
            Filter this menu
          </label>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            id="menu-filter"
            type="search"
            value={query}
            placeholder="Filter menu"
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                onQueryChange("");
              }
            }}
            className={cn(
              "bg-card border-input text-body h-9 w-full rounded-sm border pl-8",
              query ? "pr-8" : "pr-2",
              "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear menu filter"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {sections.length > 0 && (
          <div
            ref={listRef}
            role="tablist"
            aria-label="Menu sections"
            aria-orientation="horizontal"
            className="scrollbar-hide flex min-w-0 flex-1 gap-1.5 overflow-x-auto"
          >
            {sections.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  role="tab"
                  type="button"
                  id={`tab-${section.id}`}
                  aria-selected={isActive}
                  aria-controls={`section-${section.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onSelectSection(section.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                    event.preventDefault();
                    const index = sections.findIndex((s) => s.id === activeSection);
                    const delta = event.key === "ArrowRight" ? 1 : -1;
                    const next = sections[(index + delta + sections.length) % sections.length];
                    onSelectSection(next.id);
                  }}
                  className={cn(
                    "h-9 shrink-0 rounded-sm px-3 text-label whitespace-nowrap",
                    "transition-colors duration-(--duration-micro) ease-(--ease-standard)",
                    "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
