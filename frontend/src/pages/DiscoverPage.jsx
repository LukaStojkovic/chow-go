/**
 * Home / discovery.
 *
 * Composed entirely of feature sections; this file owns routing guards and the
 * one piece of cross-section state (which dish the customisation sheet is
 * showing). Sections fetch their own data and own their own loading, empty and
 * error states, so a failure in one never blanks the page.
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "@/store/useAuthStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import useCartStore from "@/store/useCartStore";

import { PageContainer, Stack } from "@/components/layout/primitives";
import { CategoryRail } from "@/components/discovery/CategoryRail";
import { ItemCustomizationSheet } from "@/components/basket/ItemCustomizationSheet";
import { PromotionsSection } from "@/features/home/PromotionsSection";
import { NearbyRestaurantsSection } from "@/features/home/NearbyRestaurantsSection";
import { NewInTownSection } from "@/features/home/NewInTownSection";
import { ReorderSection } from "@/features/home/ReorderSection";
import { PopularDishesSection } from "@/features/home/PopularDishesSection";
import { DiscoveryFeed } from "@/features/home/DiscoveryFeed";

export default function DiscoverPage() {
  const { address, coordinates } = useDeliveryStore();
  const authUser = useAuthStore((state) => state.authUser);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const {
    activeCategory,
    setActiveCategory,
    fetchFeed,
    fetchPopular,
    fetchPromotions,
  } = useDiscoverStore();

  const [selectedDish, setSelectedDish] = useState(null);

  const hasLocation = Boolean(address && coordinates?.lat && coordinates?.lon);

  useEffect(() => {
    if (authUser) fetchCart();
  }, [authUser, fetchCart]);

  useEffect(() => {
    if (!hasLocation) return;
    fetchFeed(coordinates.lat, coordinates.lon);
    fetchPopular(coordinates.lat, coordinates.lon);
    // `activeCategory` is a dependency because changing it resets the feed and
    // page 1 has to be refetched.
  }, [hasLocation, coordinates?.lat, coordinates?.lon, activeCategory, fetchFeed, fetchPopular]);

  // Promotions and new arrivals are not category-filtered, so they refetch on a
  // change of address only - not every time a cuisine chip is pressed.
  useEffect(() => {
    if (!hasLocation) return;
    fetchPromotions(coordinates.lat, coordinates.lon);
  }, [hasLocation, coordinates?.lat, coordinates?.lon, fetchPromotions]);

  // Discovery is meaningless without a delivery address; the landing page is
  // where one is chosen. `replace` keeps this out of the history stack so Back
  // does not bounce between the two.
  if (!hasLocation) return <Navigate to="/" replace />;

  return (
    <>
      <PageContainer as="div" className="py-5 sm:py-6">
        <h1 className="sr-only">Restaurants and dishes delivering to {address}</h1>

        <Stack gap="2xl">
          <section aria-label="Browse by category">
            <CategoryRail value={activeCategory} onChange={setActiveCategory} />
          </section>

          <PromotionsSection />
          <ReorderSection />
          <NearbyRestaurantsSection />
          <NewInTownSection />
          <PopularDishesSection onAddDish={setSelectedDish} />
          <DiscoveryFeed onAddDish={setSelectedDish} />
        </Stack>
      </PageContainer>

      <ItemCustomizationSheet dish={selectedDish} onClose={() => setSelectedDish(null)} />
    </>
  );
}
