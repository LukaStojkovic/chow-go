import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Star } from "lucide-react-native";
import { formatDistance } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

export function RestaurantCard({ restaurant, onPress }) {
  const { color } = useTokens();
  const distance = formatDistance(restaurant.distance);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={restaurant.name}
      onPress={onPress}
      className="gap-2 active:opacity-70"
    >
      <View className="aspect-[16/9] overflow-hidden rounded-md bg-muted">
        {restaurant.coverImage ? (
          <Image
            source={restaurant.coverImage}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
          />
        ) : null}
        {restaurant.isOpen === false ? (
          <View className="absolute inset-0 items-center justify-center bg-black/55">
            <Text variant="label" tone="scrim">
              Closed
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-1">
        <Text variant="h3" numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Star size={13} color={color.rating} fill={color.rating} />
          <Text variant="body-sm" tone="muted">
            {restaurant.rating ? restaurant.rating.toFixed(1) : "New"}
          </Text>
          <Text variant="body-sm" tone="muted">
            ·
          </Text>
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {restaurant.cuisine}
          </Text>
          {distance ? (
            <>
              <Text variant="body-sm" tone="muted">
                ·
              </Text>
              <Text variant="body-sm" tone="muted">
                {distance}
              </Text>
            </>
          ) : null}
        </View>
        <Text variant="caption" tone="muted">
          {restaurant.deliveryEstimate}
        </Text>
      </View>
    </Pressable>
  );
}
