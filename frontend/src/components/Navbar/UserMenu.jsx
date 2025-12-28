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
  Store,
  LogOut,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserMenu({ user, onLogout }) {
  const { theme, setTheme } = useDarkMode();
  const navigate = useNavigate();

  const isSeller = user?.role === "seller";

  const ThemeIcon = ({ currentTheme }) => {
    switch (currentTheme) {
      case "light":
        return <Sun className="mr-3 h-4 w-4 text-emerald-600" />;
      case "dark":
        return <Moon className="mr-3 h-4 w-4 text-emerald-600" />;
      default:
        return <Monitor className="mr-3 h-4 w-4 text-emerald-600" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-2 py-1.5 outline-none ring-2 ring-transparent backdrop-blur-md transition-all duration-200 hover:bg-white hover:ring-emerald-500/30 dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:hover:ring-emerald-500/20 sm:px-4 sm:py-2">
          <img
            src={user.profilePicture || "/defaultProfilePicture.png"}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-500/40"
          />
          <span className="hidden text-sm font-medium text-gray-900 dark:text-gray-100 sm:block">
            {user.name || "User"}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-gray-500 transition-transform duration-200 sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          className="mt-2 w-64 rounded-2xl border border-gray-200/50 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95"
          style={{ zIndex: 9999 }}
        >
          <DropdownMenuLabel className="flex flex-col items-start rounded-lg bg-gray-50 px-4 py-3 dark:bg-zinc-800/50">
            <span className="max-w-full truncate text-base font-bold text-gray-900 dark:text-white">
              {user.name || "Current User"}
            </span>
            {user.email && (
              <span className="mt-1 max-w-full truncate text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2 h-px bg-gray-200 dark:bg-zinc-700" />

          {isSeller ? (
            <DropdownMenuItem
              onClick={() => navigate("/seller/dashboard")}
              className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/30"
            >
              <Store className="mr-3 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">Manage Restaurant</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/30"
            >
              <User className="mr-3 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">Profile</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="my-1 flex w-full cursor-pointer items-center rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/30">
              <div className="flex flex-1 items-center">
                <ThemeIcon currentTheme={theme} />
                <span className="text-sm font-medium">Theme</span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="ml-2 rounded-2xl border border-gray-200/50 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95">
                {["light", "dark", "system"].map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => setTheme(t)}
                    className="flex cursor-pointer items-center rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/30"
                  >
                    {t === "light" && (
                      <Sun className="mr-3 h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    {t === "dark" && (
                      <Moon className="mr-3 h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    {t === "system" && (
                      <Monitor className="mr-3 h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <span className="flex-1 text-sm font-medium capitalize">
                      {t}
                    </span>
                    {theme === t && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="my-2 h-px bg-gray-200 dark:bg-zinc-700" />

          <DropdownMenuItem
            onClick={onLogout}
            className="my-1 flex cursor-pointer items-center rounded-lg px-4 py-3 text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
          >
            <LogOut className="mr-3 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
