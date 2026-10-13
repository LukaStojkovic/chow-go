import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { formatRating } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { ReviewStars } from "./ReviewStars";

export function ReviewSummary({ summary }) {
  const { t } = useTranslation("restaurant");
  if (!summary) return null;

  const distribution = summary.distribution ?? {};
  const largest = Math.max(1, ...Object.values(distribution).map(Number));
  const topTags = summary.topTags ?? [];

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-5">
        <View className="items-center gap-1">
          <Text variant="price-xl">{formatRating(summary.average) ?? "-"}</Text>
          <ReviewStars value={Math.round(summary.average ?? 0)} />
          <Text variant="caption" tone="muted" className="text-center">
            {t("restaurant:reviews.basedOn", { count: summary.count ?? 0 })}
          </Text>
        </View>

        <View className="flex-1 gap-1.5">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = Number(distribution[score]) || 0;
            return (
              <View
                key={score}
                accessible
                accessibilityLabel={`${t("restaurant:reviews.stars", { count: score })}: ${count}`}
                className="flex-row items-center gap-2"
              >
                <Text variant="label-sm" tone="muted" className="w-3 text-center">
                  {score}
                </Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <View className="h-2 rounded-full bg-rating" style={{ width: `${(count / largest) * 100}%` }} />
                </View>
                <Text variant="caption" tone="muted" className="w-8 text-right">
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {topTags.length > 0 ? (
        <View className="gap-2">
          <Text variant="label-sm" tone="muted">
            {t("restaurant:reviews.peopleMention")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {topTags.map(({ tag, count }) => (
              <Badge key={tag} tone="mint" size="sm">
                {`${t(`restaurant:reviews.tags.${tag}`, { defaultValue: tag })} · ${count}`}
              </Badge>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}
