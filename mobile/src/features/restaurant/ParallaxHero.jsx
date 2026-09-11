import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { Clock, MapPin, Star } from "lucide-react-native";
import { formatDistance, formatFee, formatRating, formatReviewCount } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

export const HERO_HEIGHT = 260;

/**
 * The restaurant hero.
 *
 * The photograph runs full-bleed with nothing on it but a single white pill
 * carrying the two facts you decide on - how long, and how much delivery costs.
 * The name and the rest of the detail sit on a white sheet that overlaps the
 * image from below, so type is never fighting a photograph for contrast.
 */
export function ParallaxHero({ restaurant, scrollY }) {
  const { color } = useTokens();

  // Stretches on overscroll and drifts at half speed on the way up - the
  // standard iOS header feel, and cheap because it stays on the UI thread.
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.5],
        ),
      },
      { scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0], [2, 1], "clamp") },
    ],
  }));

  const distance = formatDistance(restaurant?.distance);
  const closed = restaurant && restaurant.availability !== "open";

  return (
    <View>
      <View style={{ height: HERO_HEIGHT }} className="overflow-hidden bg-muted">
        <Animated.View style={[{ flex: 1 }, style]}>
          {restaurant?.coverImage ? (
            <Image
              source={restaurant.coverImage}
              style={{ flex: 1 }}
              contentFit="cover"
              transition={500}
              cachePolicy="memory-disk"
            />
          ) : null}
        </Animated.View>

        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "transparent"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 }}
        />

        {restaurant ? (
          <View className="absolute bottom-8 left-5 flex-row items-center gap-2 rounded-full bg-card px-4 py-2.5">
            <Clock size={15} color={color.primary} />
            <Text variant="label">{restaurant.deliveryEstimate}</Text>
            <Text variant="label-sm" tone="muted">
              ·
            </Text>
            <Text variant="label-sm" tone="muted">
              {formatFee(restaurant.deliveryFee)} delivery
            </Text>
          </View>
        ) : null}
      </View>

      {/* The sheet that carries every fact about the restaurant, lifted over
          the bottom edge of the photograph. */}
      <View className="-mt-5 gap-3 rounded-t-3xl bg-background px-5 pb-1 pt-5">
        <View className="gap-1">
          <Text variant="h1" numberOfLines={2}>
            {restaurant?.name ?? ""}
          </Text>
          {restaurant ? (
            <Text variant="body" tone="muted" numberOfLines={1}>
              {restaurant.cuisine}
            </Text>
          ) : null}
        </View>

        {restaurant ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <Star size={13} color={color.rating} fill={color.rating} />
              <Text variant="label-sm">{formatRating(restaurant.rating)}</Text>
              {restaurant.reviewCount ? (
                <Text variant="label-sm" tone="muted" numberOfLines={1}>
                  {formatReviewCount(restaurant.reviewCount)} reviews
                </Text>
              ) : null}
            </View>

            <Badge tone={closed ? "neutral" : "mint"}>
              {restaurant.availability === "unavailable"
                ? "Not taking orders"
                : closed
                  ? "Closed now"
                  : "Open now"}
            </Badge>

            {distance ? <Badge tone="neutral" icon={MapPin}>{`${distance} away`}</Badge> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
