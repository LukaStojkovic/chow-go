/**
 * Search filters and sorting.
 *
 * The search endpoint returns an unfiltered set of nearby matches, so these
 * refine client-side. That is honest for the data volume involved (the backend
 * caps restaurant results at five) and keeps typing responsive.
 *
 * Filters are visible rather than hidden behind a modal - on a result set this
 * small, a "Filters (2)" button that opens a sheet is more taps for less
 * information.
 */

import { SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useDeliveryTimeFilters, useSortOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A toggle chip. Real `aria-pressed` button semantics, because unlike the
 * category rail these combine freely.
 */
function FilterChip({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-sm border px-3 text-label",
        "transition-colors duration-(--duration-micro) ease-(--ease-standard)",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isActive
          ? "border-primary bg-primary-subtle text-primary-subtle-foreground"
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * @param {Object} props
 * @param {import("./filters").SearchFilterState} props.filters
 * @param {(next: import("./filters").SearchFilterState) => void} props.onChange
 * @param {number} props.activeCount
 * @param {() => void} props.onReset
 */
export function SearchFilters({ filters, onChange, activeCount, onReset }) {
  const { t } = useTranslation(["discover", "common"]);
  const deliveryTimeFilters = useDeliveryTimeFilters();
  const sortOptions = useSortOptions();
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-label">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("common:actions.filters")}
        </span>

        <FilterChip isActive={filters.openNow} onClick={() => set({ openNow: !filters.openNow })}>
          {t("discover:filters.openNow")}
        </FilterChip>

        <FilterChip
          isActive={filters.freeDelivery}
          onClick={() => set({ freeDelivery: !filters.freeDelivery })}
        >
          {t("discover:filters.freeDelivery")}
        </FilterChip>

        {deliveryTimeFilters
          .filter((option) => option.value !== "any")
          .map((option) => (
          <FilterChip
            key={option.value}
            isActive={filters.maxDeliveryTime === option.value}
            onClick={() =>
              set({
                maxDeliveryTime:
                  filters.maxDeliveryTime === option.value ? "any" : option.value,
              })
            }
          >
              {option.label}
            </FilterChip>
          ))}

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X aria-hidden="true" />
            {t("discover:filters.clear", { count: activeCount })}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="search-sort" className="text-muted-foreground shrink-0">
          {t("discover:filters.sortBy")}
        </Label>
        <Select value={filters.sort} onValueChange={(value) => set({ sort: value })}>
          <SelectTrigger id="search-sort" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
