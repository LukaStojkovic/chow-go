import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/axios";

// A plain navigation, so the browser saves the attachment itself and the
// session cookie rides along as it does for any same-site request.
export function DownloadMyData({ className }) {
  const { t } = useTranslation("profile");
  return (
    <div className={className}>
      <p className="text-body-sm text-muted-foreground">{t("account.exportDataHint")}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={() => {
          window.location.href = `${API_BASE_URL}/auth/account/export`;
        }}
      >
        <Download aria-hidden="true" />
        {t("account.exportData")}
      </Button>
    </div>
  );
}
