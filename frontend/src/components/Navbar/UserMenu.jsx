import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  User,
  Store,
  LogOut,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  Check,
  Languages,
  ShoppingBasket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LOCALES } from "@chowgo/shared/i18n";

import { setLocale } from "@/lib/i18n";

export default function UserMenu({ user, onLogout }) {
  const { theme, setTheme } = useDarkMode();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["common", "profile", "order", "seller"]);
  const activeLocale = i18n.resolvedLanguage || i18n.language;

  const isSeller = user?.role === "seller";
  const isCourier = user?.role === "courier";

  const ThemeIcon = ({ currentTheme }) => {
    switch (currentTheme) {
      case "light":
        return <Sun className="mr-3 h-4 w-4 text-primary" />;
      case "dark":
        return <Moon className="mr-3 h-4 w-4 text-primary" />;
      default:
        return <Monitor className="mr-3 h-4 w-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border/20 bg-card/60 px-2 py-1.5 outline-none ring-2 ring-transparent backdrop-blur-md transition-all duration-200 hover:bg-card hover:ring-ring/30 sm:px-4 sm:py-2">
          <img
            src={user.profilePicture || "/defaultProfilePicture.png"}
            referrerPolicy="no-referrer"
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-ring/40"
          />
          <span className="hidden text-sm font-medium text-foreground sm:block">
            {user.name || t("common:account.fallbackName")}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground transition-transform duration-200 sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          className="mt-2 w-64 rounded-2xl border border-border/50 bg-card/95 p-2 shadow-2xl backdrop-blur-xl "
          style={{ zIndex: 9999 }}
        >
          <DropdownMenuLabel className="flex flex-col items-start rounded-lg bg-muted px-4 py-3 ">
            <span className="max-w-full truncate text-base font-bold text-foreground ">
              {user.name || t("common:account.fallbackName")}
            </span>
            {user.email && (
              <span className="mt-1 max-w-full truncate text-xs text-muted-foreground ">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2 h-px bg-secondary " />

          {isSeller ? (
            <DropdownMenuItem
              onClick={() => navigate("/seller/dashboard")}
              className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle "
            >
              <Store className="mr-3 h-4 w-4 shrink-0 text-primary " />
              <span className="text-sm font-medium">{t("seller:nav.portal")}</span>
            </DropdownMenuItem>
          ) : !isCourier ? (
            <>
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle "
              >
                <User className="mr-3 h-4 w-4 shrink-0 text-primary " />
                <span className="text-sm font-medium">{t("common:nav.profile")}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/orders")}
                className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle "
              >
                <ShoppingBasket className="mr-3 h-4 w-4 shrink-0 text-primary " />
                <span className="text-sm font-medium">{t("order:list.title")}</span>
              </DropdownMenuItem>
            </>
          ) : null}

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="my-1 flex w-full cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle ">
              <div className="flex flex-1 items-center">
                <ThemeIcon currentTheme={theme} />
                <span className="text-sm font-medium">{t("profile:preferences.theme")}</span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="ml-2 rounded-2xl border border-border/50 bg-card/95 p-2 shadow-2xl backdrop-blur-xl ">
                {["light", "dark", "system"].map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setTheme(option)}
                    className="flex cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle "
                  >
                    {option === "light" && (
                      <Sun className="mr-3 h-4 w-4 shrink-0 text-primary" />
                    )}
                    {option === "dark" && (
                      <Moon className="mr-3 h-4 w-4 shrink-0 text-primary" />
                    )}
                    {option === "system" && (
                      <Monitor className="mr-3 h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="flex-1 text-sm font-medium">
                      {t(`profile:preferences.theme${option[0].toUpperCase()}${option.slice(1)}`)}
                    </span>
                    {theme === option && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Language sits beside Theme rather than only in the header. This
              menu is the one account surface every role shares, so putting it
              here makes the switch reachable from the seller portal, the
              courier portal and every customer screen at once. */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="my-1 flex w-full cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle ">
              <div className="flex flex-1 items-center">
                <Languages className="mr-3 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">{t("common:language.label")}</span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="ml-2 rounded-2xl border border-border/50 bg-card/95 p-2 shadow-2xl backdrop-blur-xl ">
                {LOCALES.map((locale) => (
                  <DropdownMenuItem
                    key={locale.code}
                    onClick={() => setLocale(locale.code)}
                    className="flex cursor-pointer items-center rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-primary-subtle "
                  >
                    <span aria-hidden="true" className="mr-3 shrink-0 text-base leading-none">
                      {locale.flag}
                    </span>
                    <span className="flex-1 text-sm font-medium">{locale.label}</span>
                    {activeLocale === locale.code && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="my-2 h-px bg-secondary " />

          <DropdownMenuItem
            onClick={onLogout}
            className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-destructive hover:bg-destructive-subtle focus:bg-destructive-subtle "
          >
            <LogOut className="mr-3 h-4 w-4 shrink-0 text-destructive " />
            <span className="text-sm font-medium">{t("common:actions.logOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
