import React from "react";
import { Button } from "../ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function MobileSidebarContent({
  authUser,
  onLogout,
  onLogin,
  onSignup,
}) {
  const profilePicture =
    authUser?.profilePicture || "/defaultProfilePicture.png";
  const navigate = useNavigate();

  return (
    <>
      {authUser ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card/50 rounded-lg sm:rounded-xl border border-border/50 ">
            <img
              src={profilePicture}
              referrerPolicy="no-referrer"
              alt={authUser.name}
              className="w-12 sm:w-14 h-12 sm:h-14 rounded-full object-cover ring-2 ring-ring/40"
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">
                Welcome back!
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {authUser.name}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => navigate("/profile")}
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-primary-subtle/50 text-muted-foreground "
            >
              <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-primary-subtle/50 text-muted-foreground "
            >
              <Settings className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              Settings
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base text-destructive hover:bg-destructive-subtle/50 "
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
            className="w-full justify-center text-base sm:text-lg font-medium h-12 sm:h-14 hover:bg-muted rounded-lg sm:rounded-xl"
          >
            Log In
          </Button>
          <Button
            onClick={() => onSignup(false)}
            className="w-full justify-center text-base sm:text-lg font-medium h-12 sm:h-14 hover:bg-muted rounded-lg sm:rounded-xl"
          >
            Sign up
          </Button>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-border/50 ">
        <a
          href="#"
          className="block text-sm sm:text-lg text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          Restaurants
        </a>
        <Link
          to="/become-courier"
          className="block text-sm sm:text-lg text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          Become a Courier
        </Link>
        <a
          href="#"
          className="block text-sm sm:text-lg text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          Help Center
        </a>
      </div>
    </>
  );
}
