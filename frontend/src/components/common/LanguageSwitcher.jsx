/**
 * Language picker.
 *
 * Switching does three things beyond changing `t`: it persists the choice, it
 * updates `<html lang>` so a screen reader picks the right voice, and it drops
 * the React Query cache so view models built by the shared adapters are rebuilt
 * in the new language. All of that lives in `lib/i18n.js`; this is the control.
 *
 * `variant="menu"` is the compact header control; `variant="list"` is the
 * settings row, where both options are visible and the current one is checked.
 */

import { useTranslation } from "react-i18next";
import { Check, Languages } from "lucide-react";
import { LOCALES } from "@chowgo/shared/i18n";

import { cn } from "@/lib/utils";
import { setLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * @param {Object} props
 * @param {"menu"|"list"} [props.variant]
 * @param {string} [props.className]
 */
export function LanguageSwitcher({ variant = "menu", className }) {
  const { t, i18n } = useTranslation("common");
  const active = i18n.resolvedLanguage || i18n.language;

  const choose = (code) => {
    if (code === active) return;
    setLocale(code);
  };

  if (variant === "list") {
    return (
      <div className={cn("space-y-1", className)} role="radiogroup" aria-label={t("language.label")}>
        {LOCALES.map((locale) => {
          const isActive = locale.code === active;
          return (
            <button
              key={locale.code}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => choose(locale.code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left",
                "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "transition-colors duration-(--duration-micro) ease-(--ease-standard)",
                isActive ? "bg-primary-subtle text-primary-subtle-foreground" : "hover:bg-muted",
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {locale.flag}
              </span>
              <span className="text-label flex-1">{locale.label}</span>
              {isActive && <Check className="size-4 shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label={t("language.change")}
        >
          <Languages aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onSelect={() => choose(locale.code)}
            className="gap-2"
          >
            <span aria-hidden="true">{locale.flag}</span>
            <span className="flex-1">{locale.label}</span>
            {locale.code === active && <Check className="size-4" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
