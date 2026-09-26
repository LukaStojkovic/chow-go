import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { FileText, Shield } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";

export function LegalLinks({ className }) {
  const { t } = useTranslation("common");
  return (
    <Card className={className}>
      <ListRow
        icon={FileText}
        title={t("legal.terms")}
        onPress={() => router.push("/legal/terms")}
      />
      <ListRow
        icon={Shield}
        title={t("legal.privacy")}
        onPress={() => router.push("/legal/privacy")}
      />
    </Card>
  );
}
