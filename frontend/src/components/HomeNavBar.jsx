import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UtensilsCrossed, Menu, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import AuthModal from "./Auth/AuthModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function HomeNavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoginModal, setIsLoginModal] = useState(true);
  const { isDark, toggle } = useDarkMode();

  const { authUser } = useAuthStore();

  const openAuth = (login) => {
    setIsLoginModal(login);
    setIsAuthOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Chow & Go
                </span>
              </div>
            </motion.div>

            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="rounded-full"
              >
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </motion.div>
              </Button>

              <Button
                onClick={() => openAuth(true)}
                variant="ghost"
                className="font-medium"
              >
                Log In
              </Button>
              <Button
                onClick={() => openAuth(false)}
                className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                Sign Up Free
              </Button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="rounded-full"
              >
                {isDark ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>

              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 bg-white dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-6 mt-8">
                    <Button
                      onClick={() => openAuth(true)}
                      variant="ghost"
                      className="justify-start font-medium"
                    >
                      Log In
                    </Button>
                    <Button
                      onClick={() => openAuth(false)}
                      className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                    >
                      Sign Up Free
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
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
