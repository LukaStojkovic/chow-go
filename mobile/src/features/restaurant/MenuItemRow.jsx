import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";

export function MenuItemRow({ dish, onPress }) {
  const unavailable = !dish.isAvailable;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable }}
      accessibilityLabel={`${dish.name}, ${formatPrice(dish.price)}`}
      disabled={unavailable}
      onPress={onPress}
      className="flex-row gap-3 px-5 py-3 active:bg-accent"
    >
      <View className="flex-1 gap-1">
        <Text variant="label" numberOfLines={1} tone={unavailable ? "muted" : "foreground"}>
          {dish.name}
        </Text>
        {dish.description ? (
          <Text variant="body-sm" tone="muted" numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}
        <View className="flex-row items-baseline gap-1.5 pt-0.5">
          <Text variant="price" tone={unavailable ? "muted" : "foreground"}>
            {formatPrice(dish.price)}
          </Text>
          {dish.basePrice ? (
            <Text variant="caption" tone="muted" className="line-through">
              {formatPrice(dish.basePrice)}
            </Text>
          ) : null}
          {unavailable ? (
            <Text variant="caption" tone="muted">
              · Unavailable
            </Text>
          ) : null}
        </View>
      </View>

      {dish.image ? (
        <View className="h-20 w-20 overflow-hidden rounded-sm bg-muted">
          <Image
            source={dish.image}
            style={{ flex: 1, opacity: unavailable ? 0.5 : 1 }}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
          />
        </View>
      ) : null}
    </Pressable>
  );
}
