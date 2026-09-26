import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

export function ConnectGoogle({ className }) {
  const { t } = useTranslation("profile");
  const authUser = useAuthStore((state) => state.authUser);

  if (!authUser || authUser.authProvider === "google") return null;

  if (authUser.googleLinked) {
    return (
      <div className={className}>
        <p className="text-body-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          {t("account.googleConnected")}
        </p>
        <p className="text-body-sm text-muted-foreground">{t("account.googleConnectedHint")}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-body-sm text-muted-foreground">{t("account.googleConnectHint")}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={() => {
          window.location.href = `${API_BASE_URL}/auth/google/link`;
        }}
      >
        {t("account.googleConnect")}
      </Button>
    </div>
  );
}
