import { forwardRef, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { Search, Soup, Store, UtensilsCrossed } from "lucide-react";

import { cuisineLabel } from "@chowgo/shared/constants";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { SEARCH_LIMITS, highlightMatch, normalizeSearchTerm } from "@chowgo/shared/search";

import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/discovery/SearchBar";
import { useSearchSuggestions } from "@/hooks/Search/useSearch";

const SUGGEST_DELAY_MS = 180;

function Highlighted({ text, term }) {
  const parts = highlightMatch(text, term);
  if (!parts) return text;
  return (
    <>
      {parts.before}
      <mark className="text-foreground bg-transparent font-semibold">{parts.match}</mark>
      {parts.after}
    </>
  );
}

function OptionIcon({ option }) {
  if (option.type === "restaurant" && option.image) {
    return (
      <img
        src={cloudinaryUrl(option.image, { width: 64, height: 64, crop: "fill" })}
        alt=""
        className="size-8 shrink-0 rounded-sm object-cover"
      />
    );
  }
  const Icon =
    option.type === "restaurant"
      ? Store
      : option.type === "cuisine"
        ? UtensilsCrossed
        : option.type === "dish"
          ? Soup
          : Search;
  return (
    <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-sm">
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

export const SearchTypeahead = forwardRef(function SearchTypeahead(
  { value, onChange, onSubmit, coords, isSearching, autoFocus, placeholder },
  ref,
) {
  const { t } = useTranslation(["discover", "common"]);
  const navigate = useNavigate();
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index) => `${baseId}-option-${index}`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debounced] = useDebounce(value, SUGGEST_DELAY_MS);
  const { suggestions } = useSearchSuggestions({ coords, q: debounced });

  const term = normalizeSearchTerm(value);
  const options = [
    { type: "search", label: term },
    ...suggestions.map((s) => (s.type === "cuisine" ? { ...s, label: cuisineLabel(t, s.value) } : s)),
  ];
  const expanded = isOpen && term.length >= SEARCH_LIMITS.minLength;

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const select = (option) => {
    close();
    if (option.type === "restaurant") {
      navigate(`/restaurant/${option.id}`);
      return;
    }
    const next = option.type === "search" ? term : option.label;
    onChange(next);
    onSubmit(next);
  };

  const describe = (option) => {
    if (option.type === "restaurant") {
      return option.isOpen === false
        ? `${t("search.suggestionRestaurant")} · ${t("search.closedNow")}`
        : t("search.suggestionRestaurant");
    }
    if (option.type === "cuisine") return t("search.suggestionCuisine");
    if (option.type === "dish") return t("search.suggestionDish", { count: option.count ?? 1 });
    return null;
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!expanded) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((i) => (i + 1) % options.length);
      }
    } else if (event.key === "ArrowUp" && expanded) {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (event.key === "Enter" && expanded && activeIndex >= 0) {
      event.preventDefault();
      select(options[activeIndex]);
    } else if (event.key === "Escape" && expanded) {
      event.preventDefault();
      close();
    } else if (event.key === "Enter") {
      close();
    }
  };

  const activeId = expanded && activeIndex >= 0 && activeIndex < options.length ? optionId(activeIndex) : undefined;

  return (
    <SearchBar
      ref={ref}
      value={value}
      onChange={(next) => {
        onChange(next);
        setIsOpen(true);
        setActiveIndex(-1);
      }}
      onSubmit={() => {
        close();
        onSubmit(term);
      }}
      isSearching={isSearching}
      autoFocus={autoFocus}
      placeholder={placeholder}
      inputProps={{
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-expanded": expanded,
        "aria-controls": listboxId,
        "aria-activedescendant": activeId,
        onKeyDown,
        onBlur: close,
      }}
    >
      {expanded && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("search.suggestions")}
          className="bg-popover text-popover-foreground border-border shadow-raised absolute inset-x-0 top-full z-40 mt-1 max-h-96 overflow-y-auto rounded-md border py-1"
        >
          {options.map((option, index) => {
            const secondary = describe(option);
            return (
              <li
                key={`${option.type}-${option.id ?? option.value ?? option.label}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(option)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2",
                  index === activeIndex && "bg-muted",
                )}
              >
                <OptionIcon option={option} />
                <span className="min-w-0 flex-1">
                  <span className="text-body block truncate">
                    {option.type === "search" ? (
                      t("search.searchFor", { query: term })
                    ) : (
                      <Highlighted text={option.label} term={term} />
                    )}
                  </span>
                  {secondary && (
                    <span className="text-body-sm text-muted-foreground block truncate">
                      {secondary}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </SearchBar>
  );
});
