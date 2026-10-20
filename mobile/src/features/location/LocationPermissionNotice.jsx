import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MapPinOff } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Inset } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

export function LocationPermissionNotice({ kind = "foreground", body, className }) {
  const { t } = useTranslation("common");
  const { color } = useTokens();
  const background = kind === "background";

  return (
    <Inset tone="warning" className={cn("gap-3 p-4", className)}>
      <View className="flex-row items-start gap-3">
        <MapPinOff size={18} color={color.warning} />
        <View className="flex-1 gap-1">
          <Text variant="label">
            {background ? t("locationAccess.backgroundTitle") : t("locationAccess.blockedTitle")}
          </Text>
          <Text variant="body-sm" tone="muted">
            {body ?? (background ? t("locationAccess.backgroundBody") : t("locationAccess.blockedBody"))}
          </Text>
        </View>
      </View>
      <Button variant="outline" size="sm" onPress={() => Linking.openSettings()}>
        {t("locationAccess.openSettings")}
      </Button>
    </Inset>
  );
}
