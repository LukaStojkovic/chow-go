import { ShoppingBag } from "lucide-react";
import React from "react";
import MainSearchBar from "./MainSearchBar";
import DeliveryAddressDropdown from "./DeliveryAddressDropdown";
import { Button } from "../ui/button";
import Logo from "../Navbar/Logo";
import { useAuthStore } from "@/store/useAuthStore";
import UserMenu from "../Navbar/UserMenu";
import useCartStore from "@/store/useCartStore";

export default function MainHeader({ setIsCartOpen }) {
  const { authUser, logout } = useAuthStore();
  const { items } = useCartStore();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
      <div className="container mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-8">
              <Logo showTitle={false} />

              <DeliveryAddressDropdown isMobile={false} />
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
            <DeliveryAddressDropdown isMobile={true} />
            <div className="w-full">
              <MainSearchBar />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
