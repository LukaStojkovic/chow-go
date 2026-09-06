import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";

export const HERO_HEIGHT = 260;

export function ParallaxHero({ restaurant, scrollY }) {
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

  return (
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
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140 }}
      />

      <View className="absolute bottom-0 left-0 right-0 gap-1 p-5">
        <Text variant="display" tone="scrim" numberOfLines={2}>
          {restaurant?.name ?? ""}
        </Text>
        {restaurant ? (
          <Text variant="body-sm" className="text-scrim-foreground-muted">
            {restaurant.cuisine} · {restaurant.deliveryEstimate}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
