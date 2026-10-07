import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Clock } from "lucide-react-native";
import { estimateArrival } from "@chowgo/shared/adapters/order";
import { formatTime } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";
import { useNow } from "@/hooks/useNow";
import { useTokens } from "@/theme/useTokens";

export function ArrivalEstimate({ order, routeSeconds = null }) {
  const { t } = useTranslation(["order", "common"]);
  const { color } = useTokens();
  const now = useNow(30000, Boolean(order?.etaAt) || routeSeconds != null);
  const eta = estimateArrival(order, { routeSeconds, now });
  if (!eta) return null;

  const time = formatTime(eta.at);
  const headline = eta.isLate
    ? t("order:eta.late")
    : eta.minutes === 0
      ? t("order:eta.arriving")
      : t("order:eta.minutes", { count: eta.minutes });
  const detail = eta.isLate
    ? t("order:eta.lateHint", { time })
    : [t("order:eta.around", { time }), eta.isLive ? t("order:eta.liveHint") : null]
        .filter(Boolean)
        .join(" · ");

  return (
    <View
      className="flex-row items-center gap-3"
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${t("order:eta.label")}: ${headline}. ${detail}`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-full ${eta.isLate ? "bg-tertiary-subtle" : "bg-primary-subtle"}`}>
        <Clock size={22} color={eta.isLate ? color.tertiary : color.primary} />
      </View>
      <View className="flex-1">
        <Text variant="caption" tone="muted">
          {t("order:eta.label")}
        </Text>
        <Text variant="h1" tone={eta.isLate ? "tertiary" : "foreground"} numberOfLines={1}>
          {headline}
        </Text>
        <Text variant="body-sm" tone="muted" numberOfLines={1}>
          {detail}
        </Text>
      </View>
    </View>
  );
}
