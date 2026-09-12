import React from "react";
import { Button } from "../ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export default function MobileSidebarContent({
  authUser,
  onLogout,
  onLogin,
  onSignup,
}) {
  const profilePicture =
    authUser?.profilePicture || "/defaultProfilePicture.png";
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "auth", "profile"]);

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
                {t("auth:login.title")}
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
              {t("common:nav.profile")}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-primary-subtle/50 text-muted-foreground "
            >
              <Settings className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              {t("common:nav.settings")}
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base text-destructive hover:bg-destructive-subtle/50 "
            >
              <LogOut className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              {t("common:actions.logOut")}
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
            {t("auth:login.submit")}
          </Button>
          <Button
            onClick={() => onSignup(false)}
            className="w-full justify-center text-base sm:text-lg font-medium h-12 sm:h-14 hover:bg-muted rounded-lg sm:rounded-xl"
          >
            {t("auth:register.submit")}
          </Button>
        </div>
      )}

      {/* Above the secondary links on purpose: someone who cannot read the
          rest of this sheet still needs to find the language control. */}
      <div className="space-y-2 pt-4 sm:pt-6 border-t border-border/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("common:language.label")}
        </p>
        <LanguageSwitcher variant="list" />
      </div>

      <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-border/50 ">
        <a
          href="#"
          className="block text-sm sm:text-lg text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          {t("common:nav.restaurants")}
        </a>
        <Link
          to="/become-courier"
          className="block text-sm sm:text-lg text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          {t("profile:becomeCourier.cta")}
        </Link>
        <a
          href="#"
          className="block text-sm sm:text-lg text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          {t("common:nav.help")}
        </a>
      </div>
    </>
  );
}
