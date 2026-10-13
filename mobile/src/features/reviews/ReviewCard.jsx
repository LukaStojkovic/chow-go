import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/Badge";
import { Card, Inset } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { ReviewStars } from "./ReviewStars";

export function ReviewCard({ review, restaurantName, children }) {
  const { t } = useTranslation(["restaurant", "order"]);
  const reply = review.reply;

  return (
    <Card className="gap-2.5">
      <View className="flex-row items-center gap-2">
        <View className="flex-1 gap-0.5">
          <Text variant="label" numberOfLines={1}>
            {review.author ?? "-"}
          </Text>
          <View className="flex-row items-center gap-2">
            <ReviewStars value={review.rating} />
            <Text variant="caption" tone="muted">
              {formatDate(review.ratedAt)}
            </Text>
          </View>
        </View>
        {review.orderNumber ? (
          <Text variant="caption" tone="muted">
            {t("order:detail.numbered", { number: review.orderNumber })}
          </Text>
        ) : null}
      </View>

      {review.tags?.length ? (
        <View className="flex-row flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <Badge key={tag} size="sm" tone={review.rating >= 4 ? "mint" : "neutral"}>
              {t(`restaurant:reviews.tags.${tag}`, { defaultValue: tag })}
            </Badge>
          ))}
        </View>
      ) : null}

      {review.text ? <Text variant="body-sm">{review.text}</Text> : null}

      {reply ? (
        <Inset className="gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text variant="label-sm" className="flex-1" numberOfLines={1}>
              {t("restaurant:reviews.replyFrom", { restaurant: restaurantName ?? "" })}
            </Text>
            <Text variant="caption" tone="muted">
              {[formatDate(reply.repliedAt), reply.editedAt ? t("restaurant:reviews.edited") : null]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          <Text variant="body-sm">{reply.text}</Text>
        </Inset>
      ) : null}

      {children}
    </Card>
  );
}
