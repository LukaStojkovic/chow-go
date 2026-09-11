import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

/**
 * A dish in a feed - rails and the two-column grid.
 *
 * Like the restaurant card, no surface: photograph, name, price. Three lines of
 * information is the whole card, and every one of them truncates.
 */
export function DishCard({ dish, onPress, onAdd, className }) {
  const { color } = useTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${formatPrice(dish.price)}`}
      onPress={onPress}
      className={cn("w-44 gap-2.5 active:opacity-70", className)}
    >
      <View className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {dish.image ? (
          <Image
            source={dish.image}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />
        ) : null}

        {dish.discountPercent > 0 ? (
          <View className="absolute left-2.5 top-2.5 rounded-xs bg-tertiary px-2 py-1">
            <Text variant="label-sm" className="text-tertiary-foreground" numberOfLines={1}>
              -{dish.discountPercent}%
            </Text>
          </View>
        ) : null}

        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${dish.name}`}
            onPress={onAdd}
            hitSlop={10}
            className="absolute bottom-2.5 right-2.5 h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
          >
            <Plus size={19} strokeWidth={2.6} color={color.foreground} />
          </Pressable>
        ) : null}
      </View>

      <View className="gap-0.5">
        <Text variant="h3" numberOfLines={1}>
          {dish.name}
        </Text>

        <View className="flex-row items-baseline gap-1.5">
          <Text variant="price" numberOfLines={1} className="shrink-0">
            {formatPrice(dish.price)}
          </Text>
          {dish.basePrice ? (
            <Text variant="caption" tone="muted" numberOfLines={1} className="line-through">
              {formatPrice(dish.basePrice)}
            </Text>
          ) : null}
        </View>

        {dish.restaurantName ? (
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {dish.restaurantName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * A dish in a list - a restaurant's menu, and "popular near you".
 *
 * This one keeps a white surface, because unlike a feed it is a dense column of
 * near-identical rows and the card edge is what separates one tap target from
 * the next.
 *
 * The text column is `flex-1` and the thumbnail `shrink-0`: a long dish name
 * has to truncate rather than push the photograph off the right edge, which is
 * what used to happen.
 */
export function DishRow({ dish, onPress, onAdd, tag, meta, disabled = false, className }) {
  const { color, elevation, scheme } = useTokens();
  const unavailable = disabled || dish.isAvailable === false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${formatPrice(dish.price)}`}
      onPress={onPress}
      style={elevation.subtle[scheme]}
      className={cn(
        "flex-row items-center gap-3.5 rounded-lg bg-card p-3.5 active:opacity-80",
        unavailable && "opacity-55",
        className,
      )}
    >
      <View className="flex-1 gap-1">
        {tag ? (
          <Text variant="label-sm" tone="tertiary" numberOfLines={1}>
            {tag}
          </Text>
        ) : null}

        <Text variant="h3" numberOfLines={2}>
          {dish.name}
        </Text>

        {dish.description ? (
          <Text variant="body-sm" tone="muted" numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}

        <View className="flex-row items-baseline gap-1.5 pt-0.5">
          <Text variant="price" className="shrink-0">
            {formatPrice(dish.price)}
          </Text>
          {dish.basePrice ? (
            <Text
              variant="body-sm"
              tone="muted"
              numberOfLines={1}
              className="shrink-0 line-through"
            >
              {formatPrice(dish.basePrice)}
            </Text>
          ) : null}
          {meta ? (
            <Text variant="body-sm" tone="muted" numberOfLines={1} className="flex-1">
              · {meta}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="h-[86px] w-[86px] shrink-0">
        <View className="h-full w-full overflow-hidden rounded-md bg-muted">
          {dish.image ? (
            <Image
              source={dish.image}
              style={{ flex: 1 }}
              contentFit="cover"
              transition={400}
              cachePolicy="memory-disk"
            />
          ) : null}
        </View>

        {onAdd && !unavailable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${dish.name}`}
            onPress={onAdd}
            hitSlop={10}
            style={elevation.raised[scheme]}
            className="absolute -bottom-1.5 -right-1.5 h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
          >
            <Plus size={19} strokeWidth={2.6} color={color.foreground} />
          </Pressable>
        ) : null}

        {unavailable ? (
          <View className="absolute inset-0 items-center justify-center rounded-md bg-black/50">
            <Text variant="label-sm" tone="scrim">
              Sold out
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
