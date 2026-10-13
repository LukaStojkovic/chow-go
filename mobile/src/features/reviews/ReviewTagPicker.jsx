import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { REVIEW_LIMITS, tagsForRating } from "@chowgo/shared/reviews";
import { Chip } from "@/components/ui/Chip";
import { Text } from "@/components/ui/Text";

export function keepOfferedTags(kind, rating, selected) {
  const offered = tagsForRating(kind, rating);
  return selected.filter((tag) => offered.includes(tag));
}

export function ReviewTagPicker({ kind, rating, value, onChange }) {
  const { t } = useTranslation("restaurant");
  const offered = tagsForRating(kind, rating);
  if (offered.length === 0) return null;

  function toggle(tag) {
    if (value.includes(tag)) onChange(value.filter((entry) => entry !== tag));
    else if (value.length < REVIEW_LIMITS.maxTags) onChange([...value, tag]);
  }

  return (
    <View className="gap-2">
      <Text variant="label-sm" tone="muted">
        {t("restaurant:reviews.tagsPrompt")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {offered.map((tag) => (
          <Chip
            key={tag}
            label={t(`restaurant:reviews.tags.${tag}`, { defaultValue: tag })}
            active={value.includes(tag)}
            showCheck
            onPress={() => toggle(tag)}
          />
        ))}
      </View>
    </View>
  );
}
