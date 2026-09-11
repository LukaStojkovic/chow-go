import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Heart, Star } from "lucide-react-native";
import { formatDistance, formatFee, formatRating } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

/**
 * A restaurant in a feed.
 *
 * There is deliberately no card: the photograph carries its own rounded
 * corners and the type sits directly on the page. A white panel behind every
 * item adds a border, a shadow and eight points of padding to say something the
 * spacing already says, and twenty of them down a feed is what makes a list
 * look busy.
 *
 * Two lines of metadata, both truncated. Everything here is optional at the API
 * level, so the meta line is assembled from whatever actually exists rather
 * than rendering empty separators.
 */
export function RestaurantCard({ restaurant, onPress, isFavourite, onToggleFavourite, className }) {
  const { color } = useTokens();
  const closed = restaurant.availability !== "open";

  const meta = [restaurant.cuisine, formatDistance(restaurant.distance)]
    .filter(Boolean)
    .join(" · ");
  const delivery = [restaurant.deliveryEstimate, `${formatFee(restaurant.deliveryFee)} delivery`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={restaurant.name}
      onPress={onPress}
      className={cn("gap-3 active:opacity-70", className)}
    >
      <View className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
        {restaurant.coverImage ? (
          <Image
            source={restaurant.coverImage}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />
        ) : null}

        {onToggleFavourite ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? "Remove from favourites" : "Save to favourites"}
            onPress={onToggleFavourite}
            hitSlop={12}
            className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/35 active:opacity-70"
          >
            <Heart
              size={17}
              strokeWidth={2.2}
              color={color["scrim-foreground"]}
              fill={isFavourite ? color["scrim-foreground"] : "transparent"}
            />
          </Pressable>
        ) : null}

        {closed ? (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <View className="rounded-full bg-card px-3.5 py-1.5">
              <Text variant="label-sm">
                {restaurant.availability === "unavailable" ? "Unavailable" : "Closed"}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="gap-1">
        {/* The name shrinks and truncates; the rating never does. A rating that
            wraps onto its own line is worse than a clipped restaurant name. */}
        <View className="flex-row items-center gap-2">
          <Text variant="h3" numberOfLines={1} className="flex-1">
            {restaurant.name}
          </Text>
          {restaurant.rating ? (
            <View className="shrink-0 flex-row items-center gap-1">
              <Star size={13} color={color.rating} fill={color.rating} />
              <Text variant="label-sm">{formatRating(restaurant.rating)}</Text>
            </View>
          ) : null}
        </View>

        {meta ? (
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}

        <Text variant="body-sm" tone="muted" numberOfLines={1}>
          {delivery}
        </Text>
      </View>
    </Pressable>
  );
}
