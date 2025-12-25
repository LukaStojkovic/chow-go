import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import Categories from "../components/Discover/Categories";
import RestaurantCard from "../components/Discover/RestaurantCard";
import PromoCarousel from "@/components/Discover/PromoCarousel";
import { CATEGORIES, PROMOS, RESTAURANTS } from "@/lib/constants";
import NearYouSection from "@/components/Discover/NearYouSection";
import CartSidebar from "@/components/Discover/CartSidebar";
import { Button } from "@/components/ui/button";
import NearbyRestaurantsSection from "@/components/Discover/NearbyRestaurantsSection";
import MainHeader from "@/components/Discover/MainHeader";

export default function DiscoverPage() {
  const { address } = useDeliveryStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (!address) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100 transition-colors duration-300">
      <MainHeader />

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

        <NearYouSection />

        <section className="pt-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Popular Right Now
            </h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {[...RESTAURANTS].reverse().map((restaurant, idx) => (
              <div
                key={`pop-${restaurant.id}-${idx}`}
                className="w-72 shrink-0"
              >
                <RestaurantCard data={restaurant} index={idx} />
              </div>
            ))}
          </div>
        </section>
      </main>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="mt-12 flex justify-center">
        <Button
          variant="outline"
          size="lg"
          className="h-12 rounded-full px-8 text-base font-semibold shadow-sm hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
        >
          Load more
        </Button>
      </div>
    </div>
  );
}
