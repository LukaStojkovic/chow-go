import { ChevronRight, MapPin, ShoppingBag } from "lucide-react";
import React from "react";
import MainSearchBar from "./MainSearchBar";
import { Button } from "../ui/button";
import Logo from "../Navbar/Logo";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useAuthStore } from "@/store/useAuthStore";
import UserMenu from "../Navbar/UserMenu";
import useCartStore from "@/store/useCartStore";

export default function MainHeader({ setIsCartOpen }) {
  const { address } = useDeliveryStore();
  const { authUser, logout } = useAuthStore();
  const { items } = useCartStore();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
      <div className="container mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-8">
              <Logo showTitle={false} />

              <div className="hidden md:flex flex-col border-l border-gray-200 dark:border-zinc-800 pl-6">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
                  Delivering to
                </span>
                <div className="group flex cursor-pointer items-center gap-1 text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                  <span className="max-w-[180px] truncate text-sm font-bold">
                    {address}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCartOpen(true)}
                variant="ghost"
                className="relative h-10 w-10 rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
              >
                <ShoppingBag className="h-5 w-5" />
                {items.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                )}
              </Button>
              {authUser && <UserMenu user={authUser} onLogout={logout} />}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="md:hidden flex items-center gap-2 w-full px-1 mb-1">
              <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm font-bold truncate flex-1">
                {address}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-full">
              <MainSearchBar />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
