import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import { isTextual } from "@/lib/isTextual";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Every button is a pill. The design has no square-cornered action anywhere -
// curvature is what makes a thing read as pressable in this system.
const VARIANTS = {
  primary: { view: "bg-primary", label: "text-primary-foreground", spinner: "primary-foreground" },
  // The mint wash. Modifiers, quantity controls, secondary actions - anything
  // that should read as green without competing with the real CTA.
  mint: { view: "bg-primary-subtle", label: "text-primary-subtle-foreground", spinner: "primary" },
  tertiary: {
    view: "bg-tertiary",
    label: "text-tertiary-foreground",
    spinner: "tertiary-foreground",
  },
  secondary: { view: "bg-secondary", label: "text-secondary-foreground", spinner: "foreground" },
  outline: {
    view: "border-[1.5px] border-border-strong bg-card",
    label: "text-foreground",
    spinner: "foreground",
  },
  ghost: { view: "bg-transparent", label: "text-foreground", spinner: "foreground" },
  destructive: {
    view: "bg-destructive",
    label: "text-destructive-foreground",
    spinner: "destructive-foreground",
  },
  // Inverted pill, for actions sitting on a photograph or inside a dark bar.
  inverse: { view: "bg-foreground", label: "text-background", spinner: "background" },
};

const SIZES = {
  sm: { view: "h-9 px-4", text: "label-sm" },
  md: { view: "h-12 px-5", text: "label" },
  // 52pt: the design's thumb-ergonomic primary height.
  lg: { view: "h-[52px] px-6", text: "body-lg" },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  haptic = true,
  fullWidth = false,
  className,
  ...props
}) {
  const isInactive = disabled || loading;
  const styles = VARIANTS[variant];
  const sizing = SIZES[size];
  const { color } = useTokens();

  // Scale to 98% on press rather than dimming. A pill that dips reads as a
  // physical control; one that fades reads as disabled.
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      onPress={(event) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      style={animated}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-full",
        styles.view,
        sizing.view,
        fullWidth && "w-full",
        isInactive && "opacity-45",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color[styles.spinner]} />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {isTextual(children) ? (
            <Text variant={sizing.text} className={cn("font-jakarta-bold", styles.label)}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

// A circular icon button - the back/share/favourite chrome that floats over a
// hero image, and the compact actions inside cards.
export function IconButton({
  icon: Icon,
  onPress,
  label,
  size = 40,
  variant = "surface",
  className,
  ...props
}) {
  const { color } = useTokens();

  const TINTS = {
    surface: { view: "bg-card", icon: color.foreground },
    muted: { view: "bg-muted", icon: color.foreground },
    mint: { view: "bg-primary-subtle", icon: color.primary },
    primary: { view: "bg-primary", icon: color["primary-foreground"] },
    scrim: { view: "bg-black/40", icon: color["scrim-foreground"] },
  };
  const tint = TINTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={{ width: size, height: size }}
      className={cn(
        "items-center justify-center rounded-full active:opacity-70",
        tint.view,
        className,
      )}
      {...props}
    >
      <Icon size={Math.round(size * 0.45)} color={tint.icon} />
    </Pressable>
  );
}
