/**
 * The customer application shell.
 *
 * Owns the one piece of state the whole shell shares - whether the basket
 * panel is open - and provides it through context so any screen can open the
 * basket without prop-drilling a setter through three layers, which is what
 * the previous `setIsCartOpen` chain did.
 */

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/layout/PageTransition";
import { BasketUIContext } from "./basketUI";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";
import { BasketPanel } from "@/components/basket/BasketPanel";

/**
 * Keyboard users land on the header on every navigation; this gives them one
 * key press to jump past it to the content.
 */
function SkipLink() {
  return (
    <a
      href="#main"
      className={cn(
        "focusable-sr-only bg-primary text-primary-foreground",
        "fixed top-3 left-3 z-50 rounded-sm px-4 py-2 text-label font-semibold shadow-overlay",
      )}
    >
      Skip to content
    </a>
  );
}

/**
 * @param {Object} props
 * @param {"app"|"detail"} [props.variant] Passed through to the header.
 * @param {string} [props.title] Required when `variant` is "detail".
 * @param {boolean} [props.showBasket] Screens that *are* the basket (checkout)
 *   hide the panel trigger so there is one basket surface at a time.
 * @param {boolean} [props.showBottomNav]
 * @param {React.ReactNode} [props.headerSlot] Extra header row, e.g. the
 *   restaurant page's sticky category navigation.
 * @param {React.ReactNode} [props.children] Falls back to an `<Outlet />` so
 *   this works as both a wrapper and a route layout element.
 */
export function CustomerShell({
  variant = "app",
  title,
  showBasket = true,
  showBottomNav = true,
  headerSlot,
  backTo,
  children,
}) {
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  const basketUI = useMemo(
    () => ({
      isBasketOpen,
      openBasket: () => setIsBasketOpen(true),
      closeBasket: () => setIsBasketOpen(false),
    }),
    [isBasketOpen],
  );

  return (
    <BasketUIContext.Provider value={basketUI}>
      <div className="bg-background flex min-h-dvh flex-col">
        <SkipLink />

        <AppHeader
          variant={variant}
          title={title}
          backTo={backTo}
          onOpenBasket={showBasket ? basketUI.openBasket : undefined}
        >
          {headerSlot}
        </AppHeader>

        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {/* Used as a plain wrapper when `children` are passed; as a route
              layout it animates whichever screen the router resolved. */}
          {children ?? <PageTransition />}
        </main>

        {showBottomNav && <BottomNavigation />}

        {showBasket && (
          <BasketPanel isOpen={isBasketOpen} onClose={basketUI.closeBasket} />
        )}
      </div>
    </BasketUIContext.Provider>
  );
}
