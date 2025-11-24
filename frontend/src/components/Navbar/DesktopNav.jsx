import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import AuthButtons from "./AuthButtons";
import UserMenu from "./UserMenu";

export default function DesktopNav({
  isDark,
  toggleTheme,
  authUser,
  onLogin,
  onSignup,
  onLogout,
}) {
  return (
    <div className="hidden md:flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full"
      >
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </motion.div>
      </Button>

      {authUser ? (
        <UserMenu
          name={authUser.name}
          profilePicture={
            authUser.profilePicture || "defaultProfilePicture.png"
          }
          onLogout={onLogout}
        />
      ) : (
        <AuthButtons onLogin={onLogin} onSignup={onSignup} />
      )}
    </div>
  );
}
