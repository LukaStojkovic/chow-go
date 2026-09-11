import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Percent } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

/**
 * The one promotional panel in the app.
 *
 * The dish photograph is the surface: a heavily blurred copy of it fills the
 * card and a green glass sheet is laid over the top, so every banner picks up
 * the colour of the food it is advertising instead of being the same flat
 * rectangle each time. The crisp copy of the same photograph sits on the right
 * as a rounded, rimmed tile, with the deepest discount clipped to its edge.
 *
 * Copy is passed in rather than baked, so the banner always states something
 * the API actually returned.
 */

const alpha = (token, a) => {
  const [r, g, b] = token.match(/\d+/g);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export function PromoBanner({
  title,
  subtitle,
  onPress,
  image,
  badge,
  eyebrow = "Live now",
  cta = "Browse deals",
  accessibilityLabel,
}) {
  const { color, elevation, scheme } = useTokens();
  const white = color["scrim-foreground"];

  return (
    <View style={elevation.glow[scheme]} className="rounded-xl bg-primary">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        className="overflow-hidden rounded-xl bg-primary active:opacity-95"
      >
        {image ? (
          <Image
            source={image}
            blurRadius={32}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />
        ) : null}

        {/* The photograph is dimmed before the green goes over it, so a bright
            dish cannot lift the sheet to the point where white type on it
            drops below 4.5:1. */}
        <View className="absolute inset-0 bg-black/25" />

        <LinearGradient
          colors={[
            alpha(color["primary-hover"], 0.98),
            alpha(color.primary, 0.95),
            alpha(color["primary-bright"], 0.72),
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* The sheen across the top edge is what makes the sheet read as glass
            rather than as paint. */}
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.24)",
            "rgba(255, 255, 255, 0.05)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={[StyleSheet.absoluteFill, { bottom: "30%" }]}
        />

        <View pointerEvents="none" className="absolute inset-0 rounded-xl border border-white/15" />

        <View className="flex-row items-center gap-4 p-5">
          <View className="flex-1 gap-2">
            {eyebrow ? (
              <View className="flex-row items-center gap-1.5 self-start rounded-full border border-white/25 bg-white/15 px-2.5 py-1">
                <Percent size={11} strokeWidth={2.8} color={white} />
                <Text variant="overline" tone="scrim">
                  {eyebrow}
                </Text>
              </View>
            ) : null}

            <Text variant="h2" tone="scrim" numberOfLines={2}>
              {title}
            </Text>

            {subtitle ? (
              <Text variant="body-sm" tone="scrim-muted" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}

            <View className="mt-1 flex-row items-center gap-2 self-start rounded-full border border-white/30 bg-white/20 py-2 pl-4 pr-3">
              <Text variant="label" tone="scrim">
                {cta}
              </Text>
              <ArrowRight size={15} strokeWidth={2.6} color={white} />
            </View>
          </View>

          {image ? (
            <View className="h-[132px] w-[108px] shrink-0">
              <View
                style={elevation.overlay[scheme]}
                className="h-full w-full overflow-hidden rounded-lg border border-white/30 bg-white/10"
              >
                <Image
                  source={image}
                  style={{ flex: 1 }}
                  contentFit="cover"
                  transition={400}
                  cachePolicy="memory-disk"
                />
              </View>

              {badge ? (
                <View
                  style={elevation.raised[scheme]}
                  className="absolute -left-2.5 bottom-3.5 rounded-full border border-white/30 bg-tertiary px-2.5 py-1"
                >
                  <Text variant="label-sm" className="text-tertiary-foreground">
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
