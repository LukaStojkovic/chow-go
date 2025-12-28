import React from "react";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import BrushEffect from "@/components/BrushEffect";
import DesktopNav from "@/components/Navbar/DesktopNav";
import MobileNav from "@/components/Navbar/MobileNav";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import Logo from "@/components/Navbar/Logo";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { isDark, toggle } = useDarkMode();
  const { authUser, logout, openAuthModal } = useAuthStore();

  const openAuth = (login) => {
    openAuthModal(login);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-gray-100 selection:bg-emerald-500/30">
      <BrushEffect />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-transparent bg-white/80 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md transition-all duration-300 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo />

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
    </div>
  );
}
