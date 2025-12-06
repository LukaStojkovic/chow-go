import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  Check,
} from "lucide-react";

export default function UserMenu({ user, onLogout }) {
  const { theme, setTheme } = useDarkMode();

  const ThemeIcon = ({ currentTheme }) => {
    switch (currentTheme) {
      case "light":
        return <Sun className="w-4 h-4 mr-3 text-emerald-600" />;
      case "dark":
        return <Moon className="w-4 h-4 mr-3 text-emerald-600" />;
      default:
        return <Monitor className="w-4 h-4 mr-3 text-emerald-600" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200 
                     bg-white/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800
                     ring-2 ring-transparent hover:ring-emerald-500/30 dark:hover:ring-emerald-500/20
                     backdrop-blur-md outline-none border border-white/20 dark:border-zinc-800/50"
        >
          <img
            src={user.profilePicture || "defaultProfilePicture.png"}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
          />

          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {user.name || "User"}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          className="w-72 mt-3 bg-white/95 dark:bg-zinc-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-zinc-800/50 p-2 backdrop-blur-xl"
          style={{ zIndex: 999 }}
        >
          <DropdownMenuLabel className="flex flex-col items-start px-4 py-3 rounded-lg bg-white/50 dark:bg-zinc-800/50">
            <span className="font-bold text-base text-gray-900 dark:text-white truncate max-w-full">
              {user.name || "Current User"}
            </span>
            {user.email && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full mt-1">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="h-px bg-linear-to-r from-gray-200/0 via-gray-200 to-gray-200/0 dark:via-zinc-700 my-2" />

          <DropdownMenuItem className="cursor-pointer flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-lg transition-colors my-1">
            <User className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-sm">Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-lg transition-colors my-1">
            <Settings className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-sm">Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-lg transition-colors w-full my-1">
              <div className="flex items-center flex-1">
                <ThemeIcon currentTheme={theme} />
                <span className="font-medium text-sm">Theme</span>
              </div>
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-white/95 dark:bg-zinc-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-zinc-800/50 p-2 ml-2 backdrop-blur-xl">
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                >
                  <Sun className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="flex-1 font-medium text-sm">Light</span>
                  {theme === "light" && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                >
                  <Moon className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="flex-1 font-medium text-sm">Dark</span>
                  {theme === "dark" && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                >
                  <Monitor className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="flex-1 font-medium text-sm">System</span>
                  {theme === "system" && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="h-px bg-linear-to-r from-gray-200/0 via-gray-200 to-gray-200/0 dark:via-zinc-700 my-2" />

          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/40 rounded-lg transition-colors focus:outline-none my-1"
          >
            <LogOut className="w-4 h-4 mr-3 text-red-600 dark:text-red-400 shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
