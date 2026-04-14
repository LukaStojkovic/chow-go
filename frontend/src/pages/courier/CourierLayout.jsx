import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ListOrdered,
  Wallet,
  User,
  Power,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/Navbar/Logo";
import { SidebarLink } from "@/components/ui/SidebarLink";
import UserMenu from "@/components/Navbar/UserMenu";

export default function CourierLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const { logout, authUser } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { to: "/courier/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/courier/orders", icon: ListOrdered, label: "Deliveries" },
    { to: "/courier/earnings", icon: Wallet, label: "Earnings" },
    { to: "/courier/profile", icon: User, label: "My Profile" },
  ];

  const currentTitle =
    navItems.find((item) => item.to === location.pathname)?.label ||
    "Courier Portal";

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100">
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
          fixed inset-y-0 left-0 z-50 w-72 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900
          lg:static lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col p-6">
          <Logo className="mb-4" showTitle={true} />

          <div className="mb-6 rounded-2xl bg-gray-50 p-4 dark:bg-black/50 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Status</span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  isOnline
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
                }`}
              >
                <Power className="h-4 w-4" />
                {isOnline ? "Online" : "Offline"}
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-zinc-800">
            <UserMenu user={authUser} onLogout={logout} />
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden bg-gray-50 dark:bg-black/95">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white p-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-lg font-bold">{currentTitle}</span>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300 dark:bg-zinc-700"}`} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-gray-600 transition-transform hover:bg-gray-100 active:scale-95 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        <div className="scroll-smooth p-4 sm:p-6 lg:p-10 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 hidden lg:block">
              <h1 className="tracking-tight text-3xl font-extrabold text-gray-900 dark:text-white">
                {currentTitle}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Manage your deliveries and track your earnings
              </p>
            </div>

            <Outlet context={{ isOnline }} />
          </div>
        </div>
      </main>
    </div>
  );
}