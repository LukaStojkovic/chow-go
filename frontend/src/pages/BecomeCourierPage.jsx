import React, { useState } from "react";

import BrushEffect from "@/components/BrushEffect";
import DesktopNav from "@/components/Navbar/DesktopNav";
import MobileNav from "@/components/Navbar/MobileNav";
import Footer from "@/components/Footer";
import Logo from "@/components/Navbar/Logo";

import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";

import Hero from "@/components/BecomeCourier/Hero";
import ApplicationForm from "@/components/BecomeCourier/ApplicationForm";

export default function BecomeCourierPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();
  const { authUser, logout, openAuthModal } = useAuthStore();

  const openAuth = (login) => {
    openAuthModal(login);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-emerald-500/30 dark:bg-zinc-950 dark:text-gray-100">
      <BrushEffect />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-transparent bg-white/80 px-4 py-3 backdrop-blur-md transition-all duration-300 sm:px-6 sm:py-4 dark:bg-zinc-950/80">
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

      <main className="relative flex min-h-screen items-center justify-center px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-start lg:justify-between">
            <Hero />
            <ApplicationForm openAuthModal={openAuthModal} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
