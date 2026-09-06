import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";

export function DishCard({ dish, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${formatPrice(dish.price)}`}
      onPress={onPress}
      className="w-44 gap-2 active:opacity-70"
    >
      <View className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
        {dish.image ? (
          <Image
            source={dish.image}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
          />
        ) : null}
        {dish.discountPercent > 0 ? (
          <View className="absolute left-2 top-2 rounded-xs bg-destructive px-1.5 py-0.5">
            <Text variant="caption" className="text-destructive-foreground">
              -{dish.discountPercent}%
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-0.5">
        <Text variant="label" numberOfLines={1}>
          {dish.name}
        </Text>
        {dish.restaurantName ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {dish.restaurantName}
          </Text>
        ) : null}
        <View className="flex-row items-baseline gap-1.5">
          <Text variant="price">{formatPrice(dish.price)}</Text>
          {dish.basePrice ? (
            <Text variant="caption" tone="muted" className="line-through">
              {formatPrice(dish.basePrice)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
