import { useState } from "react";
import AuthModal from "../Auth/AuthModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import Logo from "./Logo";

export default function HomeNavBar() {
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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        setIsOpen={setIsAuthOpen}
        isLoginModal={isLoginModal}
      />
    </>
  );
}
