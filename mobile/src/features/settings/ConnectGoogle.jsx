import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Link2 } from "lucide-react-native";

import { errorMessage } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { linkGoogle } from "@/services/apiGoogle";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const LINK_ERRORS = {
  link_expired: "profile:account.googleLinkExpired",
  already_linked: "profile:account.googleAlreadyLinked",
  google_in_use: "profile:account.googleInUse",
};

export function ConnectGoogle({ className }) {
  const { t } = useTranslation("profile");
  const { color } = useTokens();
  const authUser = useAuthStore((state) => state.authUser);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [busy, setBusy] = useState(false);

  if (!authUser || authUser.authProvider === "google") return null;

  if (authUser.googleLinked) {
    return (
      <Card className={className}>
        <ListRow
          icon={CheckCircle2}
          title={t("account.googleConnected")}
          subtitle={t("account.googleConnectedHint")}
        />
      </Card>
    );
  }

  const connect = async () => {
    setBusy(true);
    try {
      const result = await linkGoogle();
      if (result.status === "linked") {
        await checkAuth();
        toast.success(t("account.googleLinked"));
      } else if (result.status === "failed") {
        toast.error(t("account.googleLinkFailed"), {
          description: t(LINK_ERRORS[result.reason] ?? "profile:account.googleLinkExpired"),
        });
      }
    } catch (error) {
      toast.error(t("account.googleLinkFailed"), { description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={className}>
      <ListRow
        icon={Link2}
        title={t("account.googleConnect")}
        subtitle={t("account.googleConnectHint")}
        onPress={busy ? undefined : connect}
        right={busy ? <ActivityIndicator color={color["muted-foreground"]} /> : undefined}
      />
    </Card>
  );
}
