import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Compass } from "lucide-react-native";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Screen } from "@/components/ui/Screen";

// Reachable from a stale push deep link or a mistyped chowgo:// URL.
export default function NotFound() {
  const { t } = useTranslation("common");
  return (
    <Screen className="justify-center">
      <EmptyState
        icon={Compass}
        title={t("error.notFound")}
        description={t("notFound.mobileBody")}
        actionLabel={t("actions.goHome")}
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
