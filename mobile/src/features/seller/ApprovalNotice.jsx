import { useTranslation } from "react-i18next";

import { Inset } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { useAuthStore } from "@/store/useAuthStore";

// Discovery hides an inactive restaurant without a word, so without this a
// seller waiting for approval, or suspended, only sees their orders dry up.
export function ApprovalNotice() {
  const { t } = useTranslation("restaurant");
  const restaurant = useAuthStore((state) => state.authUser?.restaurant?.[0]);
  const status = restaurant?.approvalStatus;
  if (!status || status === "approved") return null;

  const pending = status === "pending";
  const title = pending
    ? t("approval.pending")
    : status === "rejected"
      ? t("approval.rejected")
      : t("approval.suspended");

  return (
    <Inset tone={pending ? "warning" : "danger"} className="gap-1">
      <Text variant="label">{title}</Text>
      <Text variant="caption" tone="muted">
        {pending ? t("approval.pendingBody") : t("approval.hiddenBody")}
      </Text>
      {!pending && restaurant.approvalNote ? (
        <Text variant="caption" tone="muted">
          {t("approval.note", { note: restaurant.approvalNote })}
        </Text>
      ) : null}
    </Inset>
  );
}
