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
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <img
              src={profileImage}
              alt={authUser.name}
              className="w-14 h-14 rounded-full object-cover ring-4 ring-green-500/10"
            />
            <div>
              <p className="font-semibold text-lg">Welcome back!</p>
              <p className="text-gray-600 dark:text-gray-300">
                {authUser.name}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start h-12">
              <User className="w-5 h-5 mr-3" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start h-12">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={() => onLogin(true)}
            variant="ghost"
            className="w-full justify-start text-lg font-medium h-14 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Log In
          </Button>
          <Button
            onClick={() => onSignup(false)}
            className="w-full text-lg font-semibold h-14 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl rounded-2xl"
          >
            Sign Up Free
          </Button>
        </div>
      )}

      <div className="space-y-5 pt-8 border-t border-gray-200 dark:border-gray-800">
        <a
          href="#"
          className="block text-lg text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          Restaurants
        </a>
        <a
          href="#"
          className="block text-lg text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          Become a Rider
        </a>
        <a
          href="#"
          className="block text-lg text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          Help Center
        </a>
      </div>
    </>
  );
}
