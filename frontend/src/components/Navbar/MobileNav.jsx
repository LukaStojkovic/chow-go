import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import MobileSidebarContent from "./MobileSidebarContent";

export default function MobileNav({
  isDark,
  toggleTheme,
  isOpen,
  onOpenChange,
  authUser,
  onLogin,
  onSignup,
  onLogout,
}) {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full"
      >
        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </Button>

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative z-50">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 border-l border-gray-200/50 dark:border-zinc-800/50 p-0 backdrop-blur-xl"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-zinc-800/50">
              <h2 className="text-lg sm:text-xl font-bold">Menu</h2>
            </div>

            <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-6 overflow-y-auto">
              <MobileSidebarContent
                authUser={authUser}
                onLogin={onLogin}
                onSignup={onSignup}
                onLogout={onLogout}
              />
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-200/50 dark:border-zinc-800/50">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Chow & Go
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
