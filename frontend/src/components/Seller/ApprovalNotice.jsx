import { useTranslation } from "react-i18next";
import { Clock, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/store/useAuthStore";

// Discovery hides an inactive restaurant without a word, so without this a
// seller waiting for approval, or suspended, only sees their orders dry up.
export function ApprovalNotice() {
  const { t } = useTranslation("restaurant");
  const restaurant = useAuthStore((state) => state.authUser?.restaurant?.[0]);
  const status = restaurant?.approvalStatus;
  if (!status || status === "approved") return null;

  const pending = status === "pending";
  const Icon = pending ? Clock : ShieldAlert;
  const title = pending
    ? t("approval.pending")
    : status === "rejected"
      ? t("approval.rejected")
      : t("approval.suspended");

  return (
    <Alert variant={pending ? "default" : "destructive"}>
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{pending ? t("approval.pendingBody") : t("approval.hiddenBody")}</p>
        {!pending && restaurant.approvalNote ? <p>{t("approval.note", { note: restaurant.approvalNote })}</p> : null}
      </AlertDescription>
    </Alert>
  );
}
