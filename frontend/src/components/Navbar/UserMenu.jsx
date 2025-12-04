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
        return <Sun className="w-4 h-4 mr-3 text-yellow-500" />;
      case "dark":
        return <Moon className="w-4 h-4 mr-3 text-blue-500" />;
      default:
        return <Monitor className="w-4 h-4 mr-3 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-2 rounded-full transition-all duration-200 
                     bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 
                     ring-2 ring-transparent hover:ring-green-500/50 dark:hover:ring-green-500/30 
                     backdrop-blur-sm outline-none"
        >
          <img
            src={user.profilePicture || "defaultProfilePicture.png"}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-green-500/50"
          />

          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 hidden md:inline">
            {user.name || "User"}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          className="w-64 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-1"
          style={{ zIndex: 999 }}
        >
          <DropdownMenuLabel className="flex flex-col items-start px-3 py-2">
            <span className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-full">
              {user.name || "Current User"}
            </span>
            {user.email && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

          <DropdownMenuItem className="cursor-pointer flex items-center p-3 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <User className="w-4 h-4 mr-3 text-green-600 dark:text-green-400" />
            <span className="font-medium">Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer flex items-center p-3 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-300" />
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer flex items-center p-3 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors w-full">
              <div className="flex items-center flex-1">
                <ThemeIcon currentTheme={theme} />
                <span className="font-medium">Theme</span>
              </div>
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1 ml-1">
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                  <span className="flex-1">Light</span>
                  {theme === "light" && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Moon className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="flex-1">Dark</span>
                  {theme === "dark" && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Monitor className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="flex-1">System</span>
                  {theme === "system" && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer flex items-center p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4 mr-3 text-red-600 dark:text-red-400" />
            <span className="font-medium">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
