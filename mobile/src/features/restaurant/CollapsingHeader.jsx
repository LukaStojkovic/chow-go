import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { ArrowLeft, Heart, Info, Share2 } from "lucide-react-native";
import { IconButton } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export const BAR_HEIGHT = 56;

export function collapseOffset(barHeight, heroHeight) {
  return Math.max(0, heroHeight - barHeight);
}

export function CollapsingHeader({
  scrollY,
  collapseAt,
  collapsed,
  reduced,
  topInset,
  title,
  saved,
  onBack,
  onInfo,
  onShare,
  onToggleFavourite,
}) {
  const { t } = useTranslation(["restaurant", "common"]);

  const surface = useAnimatedStyle(() => ({
    opacity: reduced
      ? scrollY.value >= collapseAt ? 1 : 0
      : interpolate(scrollY.value, [collapseAt - 60, collapseAt], [0, 1], "clamp"),
  }));

  const heading = useAnimatedStyle(() => {
    const progress = reduced
      ? scrollY.value >= collapseAt + 20 ? 1 : 0
      : interpolate(scrollY.value, [collapseAt, collapseAt + 40], [0, 1], "clamp");
    return { opacity: progress, transform: [{ translateY: (1 - progress) * 8 }] };
  });

  const tint = collapsed ? "muted" : "scrim";

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, height: topInset + BAR_HEIGHT }}
    >
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, surface]} className="bg-background" />

      <View
        pointerEvents="box-none"
        style={{ marginTop: topInset, height: BAR_HEIGHT }}
        className="flex-row items-center gap-3 px-5"
      >
        <IconButton icon={ArrowLeft} variant={tint} label={t("common:actions.goBack")} onPress={onBack} />

        <Animated.View
          pointerEvents="none"
          aria-hidden={!collapsed}
          accessibilityElementsHidden={!collapsed}
          importantForAccessibility={collapsed ? "auto" : "no-hide-descendants"}
          style={heading}
          className="flex-1"
        >
          <Text variant="h3" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </Animated.View>

        <View className="flex-row gap-2">
          <IconButton icon={Info} variant={tint} label={t("restaurant:info.heading")} onPress={onInfo} />
          <IconButton icon={Share2} variant={tint} label={t("common:actions.share")} onPress={onShare} />
          <IconButton
            icon={Heart}
            variant={saved ? "primary" : tint}
            label={saved ? t("restaurant:favourites.removeShort") : t("restaurant:favourites.saveShort")}
            onPress={onToggleFavourite}
          />
        </View>
      </View>
    </View>
  );
}
