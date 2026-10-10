import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CalendarClock } from "lucide-react-native";
import { kitchenLeadMinutes } from "@chowgo/shared/scheduling";
import { Text } from "@/components/ui/Text";
import { useNow } from "@/hooks/useNow";
import { formatScheduledFor } from "@chowgo/shared/deliveryTime";
import { useTokens } from "@/theme/useTokens";

export function ScheduledFor({ order, prepMinutes, showCancelHint = false }) {
  const { t } = useTranslation(["order", "common"]);
  const { color } = useTokens();
  const now = useNow(60000, Boolean(order?.isScheduled));
  if (!order?.isScheduled || !order.scheduledFor) return null;

  const when = formatScheduledFor(order.scheduledFor, now);
  const hint = t("order:scheduled.hint", { minutes: kitchenLeadMinutes(prepMinutes) });

  return (
    <View
      className="flex-row items-center gap-3"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${t("order:scheduled.title")}: ${when}. ${hint}`}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-info-subtle">
        <CalendarClock size={22} color={color.info} />
      </View>
      <View className="flex-1">
        <Text variant="caption" tone="muted">
          {t("order:scheduled.title")}
        </Text>
        <Text variant="h2" numberOfLines={1}>
          {when}
        </Text>
        <Text variant="body-sm" tone="muted">
          {hint}
        </Text>
        {showCancelHint ? (
          <Text variant="body-sm" tone="muted">
            {t("order:scheduled.cancelHint")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
