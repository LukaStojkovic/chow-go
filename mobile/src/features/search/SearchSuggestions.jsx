import { Pressable, ScrollView, Text as RNText, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Search, Soup, Store, UtensilsCrossed } from "lucide-react-native";
import { cuisineLabel } from "@chowgo/shared/constants";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { highlightMatch } from "@chowgo/shared/search";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

function Highlighted({ text, term }) {
  const parts = highlightMatch(text, term);
  return (
    <Text variant="body-lg" numberOfLines={1}>
      {parts ? (
        <>
          {parts.before}
          <RNText className="font-jakarta-bold">{parts.match}</RNText>
          {parts.after}
        </>
      ) : (
        text
      )}
    </Text>
  );
}

function Row({ icon: Icon, image, label, term, detail, detailTone = "muted", onPress, accessibilityLabel }) {
  const { color } = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="flex-row items-center gap-3 px-5 py-2.5 active:opacity-60"
    >
      <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
        {image ? (
          <Image
            source={cloudinaryUrl(image, { width: 120 })}
            style={{ width: 40, height: 40 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <Icon size={18} color={color["muted-foreground"]} />
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Highlighted text={label} term={term} />
        {detail ? (
          <Text variant="body-sm" tone={detailTone} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function SearchSuggestions({ query, suggestions, onSearch, onOpenRestaurant }) {
  const { t } = useTranslation(["discover", "common"]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="pb-44 pt-1"
      accessibilityLabel={t("discover:search.suggestions")}
    >
      <Row
        icon={Search}
        label={t("discover:search.searchFor", { query })}
        term={query}
        accessibilityLabel={t("discover:search.searchFor", { query })}
        onPress={() => onSearch(query)}
      />
      {suggestions.map((suggestion) => {
        if (suggestion.type === "restaurant") {
          const detail = [
            t("discover:search.suggestionRestaurant"),
            suggestion.value ? cuisineLabel(t, suggestion.value) : null,
            suggestion.isOpen === false ? t("discover:search.closedNow") : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <Row
              key={`restaurant:${suggestion.id}`}
              icon={Store}
              image={suggestion.image}
              label={suggestion.label}
              term={query}
              detail={detail}
              accessibilityLabel={`${suggestion.label}, ${detail}`}
              onPress={() => onOpenRestaurant(suggestion.id)}
            />
          );
        }
        if (suggestion.type === "cuisine") {
          const label = cuisineLabel(t, suggestion.value);
          const detail = t("discover:search.suggestionCuisine");
          return (
            <Row
              key={`cuisine:${suggestion.value}`}
              icon={UtensilsCrossed}
              label={label}
              term={query}
              detail={detail}
              accessibilityLabel={`${label}, ${detail}`}
              onPress={() => onSearch(label)}
            />
          );
        }
        const detail = t("discover:search.suggestionDish", { count: suggestion.count ?? 1 });
        return (
          <Row
            key={`dish:${suggestion.label}`}
            icon={Soup}
            label={suggestion.label}
            term={query}
            detail={detail}
            accessibilityLabel={`${suggestion.label}, ${detail}`}
            onPress={() => onSearch(suggestion.label)}
          />
        );
      })}
    </ScrollView>
  );
}
