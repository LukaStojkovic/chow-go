import { useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { categoryOptions } from "@chowgo/shared/constants";
import {
  Beef,
  CakeSlice,
  CookingPot,
  Croissant,
  CupSoda,
  Fish,
  Flame,
  LayoutGrid,
  Pizza,
  Salad,
  Soup,
} from "lucide-react-native";
import { PressableScale } from "@/components/motion/Pressable";
import { RevealItem } from "@/components/motion/Reveal";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useMotion } from "@/theme/motion";
import { useTokens } from "@/theme/useTokens";

// The shared taxonomy stores icons as string keys so the same data drives the
// web; this is the native half of that map.
const ICONS = {
  all: LayoutGrid,
  pizza: Pizza,
  burgers: Beef,
  pasta: CookingPot,
  salads: Salad,
  grill: Flame,
  sushi: Fish,
  soups: Soup,
  breakfast: Croissant,
  desserts: CakeSlice,
  drinks: CupSoda,
};

const TILE = 56;
const GLYPH = 24;
/** How far the selected tile rises out of the row. */
const LIFT = 1.06;

/**
 * The category row.
 *
 * Tiles with the label underneath rather than a row of chips: eleven pills of
 * varying width read as a filter bar, where eleven tiles on a fixed pitch read
 * as a menu you browse. The label sits outside the tile, so the glyph is the
 * thing you scan and the word is only there to settle a tie.
 *
 * Selection is carried by the tile filling green, not by a tick. A tick is a
 * second thing to notice inside a shape that has already changed colour, and
 * it costs the glyph the room it needs to be read at this size.
 */
export function CategoryRail({ value, onChange }) {
  const { t, i18n } = useTranslation("common");
  // Rebuilt only when the language changes: `t` is a new function on every
  // re-render, and this list is rendered inside a scrolling feed.
  const categories = useMemo(() => categoryOptions(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5 pb-1"
    >
      {categories.map((category, index) => (
        <RevealItem key={category.id} index={index}>
          <CategoryTile
            label={category.label}
            icon={ICONS[category.icon] ?? LayoutGrid}
            active={value === category.value}
            onPress={() => onChange(category.value)}
          />
        </RevealItem>
      ))}
    </ScrollView>
  );
}

/**
 * One tile.
 *
 * The green fill is a second circle cross-faded over the first rather than an
 * interpolated `backgroundColor`. The palette is emitted as space-separated
 * `rgb(r g b)` for Tailwind's alpha slot, which is not a form every colour
 * parser accepts, and an opacity cross-fade needs no parsing at all - it stays
 * on the UI thread and keeps the two states as plain utility classes.
 *
 * The glyph is doubled for the same reason: an icon's colour is a prop, so the
 * two tints are stacked and faded past each other.
 */
function CategoryTile({ label, icon: Icon, active, onPress }) {
  const motion = useMotion();
  const { color, elevation, scheme } = useTokens();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const target = active ? 1 : 0;
    progress.value = motion.isReduced ? target : withSpring(target, motion.spring.snappy);
  }, [active, motion, progress]);

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * (LIFT - 1) }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const idleGlyph = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const activeGlyph = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      haptic="selection"
      scale={0.93}
      onPress={onPress}
      className="w-[70px] items-center gap-2 pt-1"
    >
      <Animated.View
        style={[tileStyle, elevation.subtle[scheme], { width: TILE, height: TILE }]}
        className="rounded-full bg-card"
      >
        <Animated.View style={fillStyle} className="absolute inset-0 rounded-full bg-primary" />

        <Animated.View style={idleGlyph} className="absolute inset-0 items-center justify-center">
          <Icon size={GLYPH} strokeWidth={1.9} color={color.foreground} />
        </Animated.View>
        <Animated.View style={activeGlyph} className="absolute inset-0 items-center justify-center">
          <Icon size={GLYPH} strokeWidth={2.3} color={color["primary-foreground"]} />
        </Animated.View>
      </Animated.View>

      <View className="w-full">
        <Text
          variant="label-sm"
          numberOfLines={2}
          className={cn("text-center", active ? "text-primary" : "text-muted-foreground")}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
