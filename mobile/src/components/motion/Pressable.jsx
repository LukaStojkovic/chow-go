import { forwardRef, useCallback } from "react";
import { Pressable } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useMotion } from "@/theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const REDUCED_DIM = 0.7;

const HAPTICS = {
  none: null,
  selection: () => Haptics.selectionAsync(),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

/**
 * The tap primitive. Every pressable surface in the app goes through this, so
 * the dip, its haptic and its reduced-motion fallback are one decision rather
 * than forty.
 *
 * Press-in is a short timing curve and release is a spring, which is the
 * asymmetry that makes a control feel like it has weight: it gives instantly
 * under a finger and settles back on its own. The release is interruptible -
 * a second tap during the settle cancels it and starts again from wherever the
 * scale had reached.
 *
 * Under reduced motion the scale is dropped and the surface dims instead, so
 * the press is still acknowledged without anything moving.
 */
export const PressableScale = forwardRef(function PressableScale(
  { children, onPress, scale, dim = 1, haptic = "light", disabled = false, style, ...props },
  ref,
) {
  const motion = useMotion();
  const reduced = motion.isReduced;
  const toScale = reduced ? 1 : (scale ?? motion.press.control);
  const toOpacity = reduced ? REDUCED_DIM : dim;
  const dims = toOpacity !== 1;
  const progress = useSharedValue(0);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - progress.value * (1 - toScale) }],
  }));

  // Applied only when something actually dims. An unconditional `opacity: 1`
  // would win over the `opacity-45` a disabled button carries in its className.
  const dimStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * (1 - toOpacity),
  }));

  const pressIn = useCallback(() => {
    cancelAnimation(progress);
    progress.value = withTiming(1, reduced ? motion.crossFade : motion.timing.instant);
  }, [motion, progress, reduced]);

  const pressOut = useCallback(() => {
    cancelAnimation(progress);
    progress.value = reduced ? withTiming(0, motion.crossFade) : withSpring(0, motion.spring.press);
  }, [motion, progress, reduced]);

  const press = useCallback(
    (event) => {
      HAPTICS[haptic]?.();
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      {...props}
      ref={ref}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={press}
      style={[scaleStyle, dims && dimStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
});
