import { useState } from "react";
import { ActivityIndicator, Share } from "react-native";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react-native";

import { errorMessage } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { exportAccountData } from "@/services/apiAuth";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

// The system share sheet rather than a file: it saves to Files, Drive or
// mail without a native file-system module and the fresh build it needs.
export function DownloadMyData({ bare = false, className }) {
  const { t } = useTranslation("profile");
  const { color } = useTokens();
  const [busy, setBusy] = useState(false);

  const share = async () => {
    setBusy(true);
    try {
      const data = await exportAccountData();
      await Share.share({
        title: `chowgo-data-${data.exportedAt.slice(0, 10)}.json`,
        message: JSON.stringify(data, null, 2),
      });
    } catch (error) {
      toast.error(t("account.exportFailed"), { description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const row = (
    <ListRow
      icon={Download}
      title={t("account.exportData")}
      subtitle={t("account.exportDataHint")}
      onPress={busy ? undefined : share}
      right={busy ? <ActivityIndicator color={color["muted-foreground"]} /> : undefined}
    />
  );

  return bare ? row : <Card className={className}>{row}</Card>;
}
