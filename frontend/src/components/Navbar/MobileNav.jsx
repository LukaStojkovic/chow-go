import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, Moon, Sun, User, Settings, LogOut } from "lucide-react";
import Logo from "./Logo";
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
    <div className="flex items-center gap-3 md:hidden">
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
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-0"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <Logo />
            </div>

            <div className="flex-1 px-6 py-10 space-y-8 overflow-y-auto">
              <MobileSidebarContent
                authUser={authUser}
                onLogin={onLogin}
                onSignup={onSignup}
                onLogout={onLogout}
              />
            </div>

            <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Chow & Go
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
