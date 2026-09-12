import { useTranslation } from "react-i18next";

import { Button } from "../ui/button";

export default function AuthButtons({ onLogin, onSignup }) {
  const { t } = useTranslation("auth");

  return (
    <>
      <Button
        onClick={onLogin}
        variant="ghost"
        className="font-medium text-sm  transition-colors"
      >
        {t("login.submit")}
      </Button>
      <button
        onClick={onSignup}
        className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95 cursor-pointer text-sm"
      >
        {t("register.submit")}
      </button>
    </>
  );
}
