/**
 * Restaurant detail and menu.
 *
 * Owns three pieces of screen state - the menu filter, which section is
 * active, and which dish the customisation sheet is showing. Everything else
 * comes from `useRestaurant` or the cart store.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, UtensilsCrossed } from "lucide-react";

import { staggerContainer } from "@/lib/motion";
import { formatPrice } from "@chowgo/shared/format";
import { filterMenuSections } from "@chowgo/shared/adapters/menu";
import { unavailableReason } from "@chowgo/shared/adapters/restaurant";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { useRestaurant } from "@/hooks/Restaurants/useRestaurant";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import useCartStore from "@/store/useCartStore";

import { PageContainer, StickyActionBar } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { ItemCustomizationSheet } from "@/components/basket/ItemCustomizationSheet";
import { useBasketUI } from "@/components/shell/basketUI";
import {
  RestaurantHero,
  RestaurantHeroSkeleton,
} from "@/features/restaurant/RestaurantHero";
import { MenuNavigation } from "@/features/restaurant/MenuNavigation";
import { MenuItemRow, MenuItemRowSkeleton } from "@/features/restaurant/MenuItemRow";
import { RestaurantInfoSheet } from "@/features/restaurant/RestaurantInfoSheet";

/** Sticky header (64px) plus the sticky menu nav (~53px), with breathing room. */
const SCROLL_OFFSET = 132;

export default function RestaurantPage() {
  const { restaurantId } = useParams();
  const { restaurant, menu, isLoadingRestaurant, isLoadingMenu, error, refetch } =
    useRestaurant(restaurantId);
  const { isFavourite, toggleFavourite, isPending } = useFavourites();
  const { openBasket } = useBasketUI();

  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.totalPrice);
  const cartRestaurant = useCartStore((state) => state.restaurant);

  const [query, setQuery] = useState("");
  // Empty until something is scrolled to or clicked; the first visible section
  // is used as the fallback below rather than being written in on mount.
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDish, setSelectedDish] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const sectionRefs = useRef({});
  // Suppresses the scroll observer while a tab click is smooth-scrolling, so
  // the sections passed through on the way do not steal the selection.
  const isProgrammaticScroll = useRef(false);

  const visibleSections = useMemo(() => filterMenuSections(menu, query), [menu, query]);

  // Derived rather than stored: filtering the menu can remove the selected
  // section entirely, and falling back here means that can never leave the
  // tablist with nothing selected.
  const activeSection =
    visibleSections.some((section) => section.id === selectedSection)
      ? selectedSection
      : (visibleSections[0]?.id ?? "");

  // Keep the active tab in step with what is actually on screen.
  useEffect(() => {
    if (visibleSections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        const onScreen = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onScreen[0]) setSelectedSection(onScreen[0].target.id.replace("section-", ""));
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -60% 0px`, threshold: 0 },
    );

    visibleSections.forEach((section) => {
      const element = sectionRefs.current[section.id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  const scrollToSection = (sectionId) => {
    setSelectedSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (!element) return;

    isProgrammaticScroll.current = true;
    const top = element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    // Long enough for a smooth scroll to settle before the observer resumes.
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  };

  if (error) {
    return (
      <PageContainer width="reading" className="py-10">
        <ErrorState
          title="We could not load this restaurant"
          description="It may have been removed, or the connection dropped on the way."
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  if (isLoadingRestaurant || !restaurant) {
    return (
      <PageContainer width="reading" className="py-5 sm:py-6">
        <span className="sr-only" role="status">
          Loading restaurant
        </span>
        <RestaurantHeroSkeleton />
        <ul className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <MenuItemRowSkeleton key={i} />
          ))}
        </ul>
      </PageContainer>
    );
  }

  const closedNotice = unavailableReason(restaurant);
  const isOrderingDisabled = Boolean(closedNotice);

  // Quantities already in the basket, so a dish the customer has added shows a
  // count rather than looking untouched.
  const basketCounts = cartItems.reduce((acc, line) => {
    const id = line.menuItem?._id || line.menuItem?.id;
    if (id) acc[String(id)] = line.quantity;
    return acc;
  }, {});

  const isThisRestaurantsBasket =
    cartItems.length > 0 && String(cartRestaurant?._id) === String(restaurantId);
  const basketPricing = buildPriceBreakdown({ subtotal: cartTotal });

  return (
    <>
      <PageContainer width="reading" className="py-5 sm:py-6">
        <RestaurantHero
          restaurant={restaurant}
          isFavourite={isFavourite(restaurant.id)}
          onToggleFavourite={() => toggleFavourite(restaurant.id)}
          isTogglingFavourite={isPending}
          onShowInfo={() => setShowInfo(true)}
        />

        <div className="mt-6">
          <MenuNavigation
            sections={visibleSections}
            activeSection={activeSection}
            onSelectSection={scrollToSection}
            query={query}
            onQueryChange={setQuery}
          />
        </div>

        {isLoadingMenu ? (
          <ul className="mt-6 space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <MenuItemRowSkeleton key={i} />
            ))}
          </ul>
        ) : visibleSections.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={query ? `Nothing matching "${query}"` : "This menu is empty"}
            description={
              query
                ? "Try a shorter term, or clear the filter to see the whole menu."
                : "The restaurant has not published any dishes yet. Check back soon."
            }
            action={
              query ? (
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear filter
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="mt-6 space-y-8 pb-4">
            {visibleSections.map((section) => (
              <section
                key={section.id}
                id={`section-${section.id}`}
                aria-labelledby={`heading-${section.id}`}
                ref={(element) => {
                  sectionRefs.current[section.id] = element;
                }}
              >
                <h2 id={`heading-${section.id}`} className="text-h1 mb-3">
                  {section.label}
                  <span className="text-body-sm text-muted-foreground ml-2 font-normal">
                    {section.items.length} {section.items.length === 1 ? "dish" : "dishes"}
                  </span>
                </h2>

                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {section.items.map((dish) => (
                    <MenuItemRow
                      key={dish.id}
                      dish={dish}
                      onSelect={setSelectedDish}
                      isOrderingDisabled={isOrderingDisabled}
                      inBasketCount={basketCounts[dish.id] ?? 0}
                    />
                  ))}
                </motion.ul>
              </section>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Contextual, not permanent: appears only once this restaurant's basket
          has something in it. Sits above the mobile tab bar. */}
      {isThisRestaurantsBasket && (
        <StickyActionBar aboveBottomNav className="md:hidden">
          <Button size="lg" block onClick={openBasket}>
            <span>
              View basket
              <span className="ml-1.5 font-normal opacity-90">
                ({cartItems.reduce((sum, line) => sum + line.quantity, 0)})
              </span>
            </span>
            <span className="tabular ml-auto flex items-center gap-2">
              {formatPrice(basketPricing.total)}
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Button>
        </StickyActionBar>
      )}

      <ItemCustomizationSheet
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        unavailableReason={closedNotice}
      />

      <RestaurantInfoSheet
        open={showInfo}
        onClose={() => setShowInfo(false)}
        restaurant={restaurant}
      />
    </>
  );
}
