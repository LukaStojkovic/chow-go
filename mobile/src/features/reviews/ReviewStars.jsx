import { View } from "react-native";
import { Star } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTokens } from "@/theme/useTokens";

export function ReviewStars({ value, size = 13 }) {
  const { t } = useTranslation("restaurant");
  const { color } = useTokens();

  return (
    <View
      accessible
      accessibilityLabel={t("restaurant:reviews.stars", { count: value })}
      className="flex-row gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          size={size}
          strokeWidth={1.8}
          color={score <= value ? color.rating : color["border-strong"]}
          fill={score <= value ? color.rating : "transparent"}
        />
      ))}
    </View>
  );
}
