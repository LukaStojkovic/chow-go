import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/Navbar/Logo";
import { SidebarLink } from "@/components/ui/SidebarLink";
import UserMenu from "@/components/Navbar/UserMenu";

export default function SellerLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, authUser } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { to: "/seller/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/seller/orders", icon: ShoppingBag, label: "Live Orders" },
    { to: "/seller/menu", icon: UtensilsCrossed, label: "Menu Management" },
    { to: "/seller/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/seller/settings", icon: Settings, label: "Restaurant Settings" },
  ];

  const currentTitle =
    navItems.find((item) => item.to === location.pathname)?.label ||
    "Seller Portal";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex overflow-hidden">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
    fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800
    transform transition-transform duration-300 ease-in-out
    lg:static lg:translate-x-0
    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
  `}
      >
        <div className="flex flex-col h-full p-6">
          <Logo className={"mb-4"} showTitle={true} />

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-zinc-800">
            <UserMenu user={authUser} onLogout={logout} />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50 dark:bg-black/95">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <span className="font-bold text-lg">{currentTitle}</span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-transform"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {currentTitle}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Manage your store performance and details
              </p>
            </div>

            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
