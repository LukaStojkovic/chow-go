import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import Categories from "../components/Discover/Categories";
import FoodItemCard from "../components/Discover/FoodItemCard";
import PromoCarousel from "@/components/Discover/PromoCarousel";
import { CATEGORIES, PROMOS } from "@/lib/constants";
import NearYouSection from "@/components/Discover/NearYouSection";
import CartSidebar from "@/components/Discover/CartSidebar";
import { Button } from "@/components/ui/button";
import NearbyRestaurantsSection from "@/components/Discover/NearbyRestaurantsSection";
import MainHeader from "@/components/Discover/MainHeader";
import useCartStore from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useDiscoverStore } from "@/store/useDiscoverStore";

export default function DiscoverPage() {
  const { address, coordinates } = useDeliveryStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const {
    feedItems,
    popularItems,
    activeCategory,
    hasMore,
    isLoadingFeed,
    isLoadingPopular,
    setActiveCategory,
    fetchFeed,
    fetchPopular,
    loadMore,
  } = useDiscoverStore();

  useEffect(() => {
    if (authUser) {
      fetchCart();
    }
  }, [authUser, fetchCart]);

  useEffect(() => {
    if (coordinates?.lat && coordinates?.lon) {
      const { lat, lon } = coordinates;
      fetchFeed(lat, lon);
      fetchPopular(lat, lon);
    }
  }, [coordinates, activeCategory, fetchFeed, fetchPopular]);

  if (!address || !coordinates?.lat || !coordinates?.lon) {
    navigate("/");
    return null;
  }

  const lat = coordinates?.lat;
  const lon = coordinates?.lon;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100 transition-colors duration-300">
      <MainHeader setIsCartOpen={setIsCartOpen} />

      <main className="container mx-auto max-w-5xl space-y-10 px-4 py-6">
        <section className="overflow-hidden rounded-2xl">
          <PromoCarousel promos={PROMOS} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Categories
            </h2>
            <button className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
              See all
            </button>
          </div>
          <Categories
            categories={CATEGORIES}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </section>

        <NearbyRestaurantsSection />

        <NearYouSection items={feedItems} isLoading={isLoadingFeed} />

        <section className="pt-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Popular Right Now
            </h2>
          </div>

          {isLoadingPopular && popularItems.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {popularItems.map((item, idx) => (
                <div
                  key={`pop-${item._id}-${idx}`}
                  className="w-72 shrink-0 h-[320px]"
                >
                  <FoodItemCard item={item} />
                </div>
              ))}
            </div>
          )}
        </section>

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => lat && lon && loadMore(lat, lon)}
              disabled={isLoadingFeed}
              className="h-12 rounded-full px-8 text-base font-semibold shadow-sm hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
            >
              {isLoadingFeed ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </main>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
