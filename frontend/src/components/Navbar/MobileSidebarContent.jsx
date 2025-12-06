import React from "react";
import { Button } from "../ui/button";
import { LogOut, Settings, User } from "lucide-react";

export default function MobileSidebarContent({
  authUser,
  onLogout,
  onLogin,
  onSignup,
}) {
  const profileImage = authUser?.profilePicture || "defaultProfilePicture.png";

  return (
    <>
      {authUser ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-zinc-800/50">
            <img
              src={profileImage}
              alt={authUser.name}
              className="w-12 sm:w-14 h-12 sm:h-14 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">
                Welcome back!
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {authUser.name}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200"
            >
              <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200"
            >
              <Settings className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              Settings
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/40"
            >
              <LogOut className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <Button
            onClick={() => onLogin(true)}
            variant="ghost"
            className="w-full justify-center text-base sm:text-lg font-medium h-12 sm:h-14 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg sm:rounded-xl"
          >
            Log In
          </Button>
          <button
            onClick={() => onSignup(false)}
            className="w-full rounded-lg sm:rounded-xl bg-black px-4 sm:px-6 py-3 sm:py-3.5 font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black text-base sm:text-lg h-12 sm:h-14 flex items-center justify-center"
          >
            Sign up
          </button>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-zinc-800/50">
        <a
          href="#"
          className="block text-sm sm:text-lg text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
        >
          Restaurants
        </a>
        <a
          href="#"
          className="block text-sm sm:text-lg text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
        >
          Become a Rider
        </a>
        <a
          href="#"
          className="block text-sm sm:text-lg text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
        >
          Help Center
        </a>
      </div>
    </>
  );
}
