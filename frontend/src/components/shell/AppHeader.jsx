/**
 * Application header.
 *
 * Two shapes, one component:
 *   `app`     the discovery header - brand, address, search, account, basket
 *   `detail`  a focused screen (checkout, an order, profile) - back, title
 *
 * Mobile and desktop share this markup rather than shipping two headers. What
 * changes across the breakpoint is what is visible and where the search lives,
 * not the structure - so the two can never fall out of step.
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/Navbar/Logo";
import UserMenu from "@/components/Navbar/UserMenu";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/common/IconButton";
import { AddressSelector } from "./AddressSelector";
import { BasketButton } from "./BasketButton";

/**
 * @param {Object} props
 * @param {"app"|"detail"} [props.variant]
 * @param {string} [props.title] Required for `detail`.
 * @param {() => void} [props.onOpenBasket] Omit to hide the basket control.
 * @param {string} [props.backTo] Explicit back destination. Without it the
 *   header goes back in history, falling back to discovery when there is none.
 * @param {React.ReactNode} [props.children] Rendered on a second row, e.g. the
 *   restaurant page's sticky menu navigation.
 */
export function AppHeader({
  variant = "app",
  title,
  onOpenBasket,
  backTo,
  children,
  className,
}) {
  const navigate = useNavigate();
  const { authUser, logout, openAuthModal } = useAuthStore();

  const goBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }
    // A deep link opened in a new tab has no history to pop.
    if (window.history.length > 1) navigate(-1);
    else navigate("/discovery");
  };

  return (
    <header
      className={cn(
        "bg-background/92 border-border sticky top-0 z-30 border-b backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[80rem] items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        {variant === "detail" ? (
          <>
            <IconButton label="Go back" onClick={goBack} showTooltip={false}>
              <ArrowLeft aria-hidden="true" />
            </IconButton>
            <h1 className="text-h2 min-w-0 flex-1 truncate">{title}</h1>
          </>
        ) : (
          <>
            <Logo />

            {/* Address is the single most consequential piece of context on
                this screen, so it gets the space the brand does not need. */}
            <div className="border-border ml-1 min-w-0 flex-1 sm:ml-3 sm:border-l sm:pl-3">
              <AddressSelector variant="full" className="max-w-full sm:max-w-72" />
            </div>

            {/* No search control here below `md`: the bottom navigation
                already owns Search as a destination, and the 40px it costs is
                the difference between the address reading "Obrenovićeva 10"
                and reading "Obren...". */}
            <nav aria-label="Secondary" className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate("/search")}>
                <Search aria-hidden="true" />
                Search
              </Button>
              {authUser?.role === "customer" && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
                  Orders
                </Button>
              )}
            </nav>
          </>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {onOpenBasket && <BasketButton onOpen={onOpenBasket} />}
          {authUser ? (
            <UserMenu user={authUser} onLogout={logout} />
          ) : (
            <Button size="sm" onClick={() => openAuthModal(true)}>
              Sign in
            </Button>
          )}
        </div>
      </div>

      {children}
    </header>
  );
}
