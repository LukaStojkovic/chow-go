import React from "react";
import { ShoppingBag } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import BrushEffect from "@/components/BrushEffect";
import DesktopNav from "@/components/Navbar/DesktopNav";
import MobileNav from "@/components/Navbar/MobileNav";
import { useState } from "react";
import AuthModal from "@/components/Auth/AuthModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoginModal, setIsLoginModal] = useState(true);

  const { isDark, toggle } = useDarkMode();
  const { authUser, logout } = useAuthStore();

  const openAuth = (login) => {
    setIsLoginModal(login);
    setIsAuthOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-gray-100 selection:bg-emerald-500/30">
      <BrushEffect />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-transparent bg-white/80 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md transition-all duration-300 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-base sm:text-xl font-bold tracking-tight hidden sm:inline">
              Chow & Go
            </span>
          </div>

          <DesktopNav
            isDark={isDark}
            toggleTheme={toggle}
            authUser={authUser}
            onLogin={() => openAuth(true)}
            onSignup={() => openAuth(false)}
            onLogout={logout}
          />

          <MobileNav
            isDark={isDark}
            toggleTheme={toggle}
            isOpen={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            authUser={authUser}
            onLogin={() => openAuth(true)}
            onSignup={() => openAuth(false)}
            onLogout={logout}
          />
        </div>
      </header>

      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthOpen}
        setIsOpen={setIsAuthOpen}
        isLoginModal={isLoginModal}
      />
    </div>
  );
}
