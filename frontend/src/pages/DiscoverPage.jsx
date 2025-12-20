import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Sparkles, ShoppingBag } from "lucide-react";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useAuthStore } from "@/store/useAuthStore";
import UserMenu from "@/components/Navbar/UserMenu";

import Categories from "../components/Discover/Categories";
import RestaurantCard from "../components/Discover/RestaurantCard";
import PromoCarousel from "@/components/Discover/PromoCarousel";
import MainSearchBar from "@/components/Discover/MainSearchBar";
import { CATEGORIES, PROMOS, RESTAURANTS } from "@/lib/constants";
import NearYouSection from "@/components/Discover/NearYouSection";
import CartSidebar from "@/components/Discover/CartSidebar";
import { Button } from "@/components/ui/button";

export default function DiscoverPage() {
  const { address, coordinates } = useDeliveryStore();
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (!address) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                Delivering to
              </span>
              <div className="group flex cursor-pointer items-center gap-1 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
                <span className="max-w-[200px] truncate font-bold sm:max-w-md">
                  {address}
                </span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:rotate-90" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
              </Button>
              {authUser && <UserMenu user={authUser} onLogout={logout} />}
            </div>
          </div>

          <MainSearchBar />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-8 px-4 py-6">
        <section className="overflow-hidden">
          <PromoCarousel promos={PROMOS} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Categories</h2>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400">
              See all
            </button>
          </div>
          <Categories
            categories={CATEGORIES}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </section>

        <NearYouSection />

        <section className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Popular Right Now
            </h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 ">
            {[...RESTAURANTS].reverse().map((restaurant, idx) => (
              <div key={restaurant.id} className="w-72 shrink-0">
                <RestaurantCard data={restaurant} index={idx} />
              </div>
            ))}
          </div>
        </section>
      </main>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
